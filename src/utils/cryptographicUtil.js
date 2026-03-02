import crypto from 'crypto';

// Constants for AES-256-GCM operations
export const ALGORITHM = 'aes-256-gcm';
export const IV_LENGTH = 16;
export const TAG_LENGTH = 16;
export const KEY_LENGTH = 32; // 256 bits
const KEY_HEX_LENGTH = KEY_LENGTH * 2;

/**
 * Standardized cryptographic utility for the AGI system.
 * Provides secure hashing, symmetric encryption (AES-256-GCM), and secure token/key generation.
 * This class ensures consistency and security across integrity checks, immutability validation,
 * and confidential data storage.
 */
export class CryptographicUtil {

    // --- Key and Token Generation ---

    /**
     * Generates a strong, cryptographically secure random key suitable for AES-256-GCM or general use.
     * @param {number} [length=KEY_LENGTH] - Length of the key in bytes (defaults to 32 bytes/256 bits).
     * @returns {string} The key encoded in hex format.
     * @throws {Error} If key length is invalid.
     */
    static generateKey(length = KEY_LENGTH) {
        if (!Number.isInteger(length) || length <= 0) {
             throw new Error("Key length must be a positive integer.");
        }
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generates a strong random token suitable for session IDs, nonces, or salt.
     * This is an alias for generateKey.
     * @param {number} [length=32] - Length of the token in bytes.
     * @returns {string} Hex encoded random bytes.
     */
    static generateToken(length = 32) {
        return CryptographicUtil.generateKey(length);
    }

    // --- Hashing and Integrity ---

    /**
     * Helper function to standardize data serialization by recursively sorting object keys.
     * This guarantees deterministic output required for consistent hashing, vital for immutability validation.
     * @private
     * @param {Object} data - The object to serialize.
     * @returns {string} The deterministically serialized JSON string.
     */
    static #deterministicSerialize(data) {
        if (typeof data === 'undefined' || data === null) {
            return '';
        }
        
        // Use the replacer function to recursively sort object keys
        return JSON.stringify(data, (key, value) => {
            if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
                // Return a new object with sorted keys
                return Object.keys(value).sort().reduce((sorted, k) => {
                    sorted[k] = value[k];
                    return sorted;
                }, {});
            }
            return value;
        });
    }

    /**
     * Generates a deterministic SHA-256 hash of a JavaScript object/payload.
     * @param {Object} data - The data object to hash (e.g., proposal payload or config state).
     * @returns {string} The SHA-256 hash in hex format.
     */
    static hashObject(data) {
        const sortedJsonString = CryptographicUtil.#deterministicSerialize(data);
        const hash = crypto.createHash('sha256').update(sortedJsonString, 'utf8').digest('hex');
        return hash;
    }
    
    // --- Symmetric Encryption (AES-256-GCM) ---

    /**
     * Encrypts a payload (string or object) using AES-256-GCM (Authenticated Encryption).
     * The output is a robust, colon-separated string: IV:EncryptedText:AuthTag.
     * 
     * @param {string|Object} payload - Data to encrypt. If an object, it is stringified using standard JSON.stringify.
     * @param {string} encryptionKeyHex - 32-byte (64 hex characters) key in hex format.
     * @returns {string} The encrypted data string (IV:Ciphertext:Tag).
     * @throws {Error} If key validation fails.
     */
    static encryptData(payload, encryptionKeyHex) {
        const dataToEncrypt = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
        
        if (encryptionKeyHex.length !== KEY_HEX_LENGTH) {
             throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes (${KEY_HEX_LENGTH} hex characters) for AES-256-GCM.`);
        }

        const keyBuffer = Buffer.from(encryptionKeyHex, 'hex');
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

        let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}; // IV:Ciphertext:Tag
    }

    /**
     * Decrypts a payload previously encrypted with AES-256-GCM.
     * @param {string} encryptedData - The colon-separated encrypted string (IV:Ciphertext:Tag).
     * @param {string} encryptionKeyHex - 32-byte (64 hex characters) key in hex format.
     * @returns {string} Decrypted data string.
     * @throws {Error} If decryption fails (e.g., tampering detected, format error, or incorrect key).
     */
    static decryptData(encryptedData, encryptionKeyHex) {
        const parts = encryptedData.split(':');
        
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format. Expected IV:Ciphertext:Tag (3 parts separated by colon).');
        }

        if (encryptionKeyHex.length !== KEY_HEX_LENGTH) {
             throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes (${KEY_HEX_LENGTH} hex characters).`);
        }

        const [ivHex, encryptedHex, tagHex] = parts;

        const keyBuffer = Buffer.from(encryptionKeyHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');

        if (iv.length !== IV_LENGTH) {
            throw new Error('Invalid IV length detected.');
        }
        if (tag.length !== TAG_LENGTH) {
            throw new Error('Invalid Authentication Tag length detected.');
        }

        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        try {
            decrypted += decipher.final('utf8');
        } catch (e) {
            // Authentication failure due to MAC mismatch, tamper detection, or incorrect key.
            throw new Error('Authentication Check Failed (MAC mismatch). Data integrity compromised or key is incorrect.');
        }

        return decrypted;
    }

    /**
     * Decrypts data and attempts to parse it as a JSON object, falling back to a string if parsing fails.
     * This provides convenience when storing complex configurations or secrets.
     * 
     * @param {string} encryptedData - The colon-separated encrypted string (IV:Ciphertext:Tag).
     * @param {string} encryptionKeyHex - 32-byte (64 hex characters) key in hex format.
     * @returns {Object|string} The decrypted data, parsed as an object if possible, otherwise the raw string.
     * @throws {Error} If decryption fails.
     */
    static decryptObject(encryptedData, encryptionKeyHex) {
        const decryptedString = CryptographicUtil.decryptData(encryptedData, encryptionKeyHex);
        try {
            const result = JSON.parse(decryptedString);
            // Ensure we don't accidentally return null if original encrypted data was "null"
            return result !== null ? result : decryptedString; 
        } catch (e) {
            // If JSON parsing fails, the original data was a string, not a serialized object.
            return decryptedString;
        }
    }
}