import { CryptographicUtil } from './cryptographicUtil.js';

/**
 * Manages access to secrets/configuration data encrypted using the system's Master Encryption Key (MEK).
 * This provider enforces the use of the MEK (expected via environment variables) for centralized security management.
 * The MEK is retrieved and validated only once upon the first access, ensuring application failure
 * if security configuration is missing or invalid at runtime.
 */
export class SecureConfigProvider {

    /**
     * @type {string | null} Cached Master Encryption Key (AGI_MEK).
     */
    static #masterEncryptionKey = null;

    /**
     * Private constructor to prevent instantiation, emphasizing its static utility nature.
     */
    constructor() {
        throw new Error("SecureConfigProvider is a static utility class and cannot be instantiated.");
    }
    
    /**
     * Retrieves and validates the MEK from environment variables, caching it on first access.
     * Throws a fatal error if the key is missing or invalid, halting system initialization.
     * @returns {string} The validated 32-byte (64 char hex) encryption key.
     * @private
     */
    static #getEncryptionKey() {
        if (SecureConfigProvider.#masterEncryptionKey) {
            return SecureConfigProvider.#masterEncryptionKey;
        }

        const key = process.env.AGI_MEK;
        
        // A 32-byte key is required to be 64 characters in hex format
        if (!key || key.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(key)) {
            // Standardizing FATAL message format for visibility during bootstrap
            throw new Error(
                '[FATAL CONFIGURATION ERROR] AGI_MEK environment variable is required and must be a 64 character hexadecimal key (32 bytes).'
            );
        }
        
        // Cache the validated key securely in memory
        SecureConfigProvider.#masterEncryptionKey = key;
        return key;
    }

    /**
     * Decrypts a specific encrypted configuration value using the MEK.
     * Automatically attempts to parse the resulting plaintext as JSON if structure indicates.
     * @param {string} encryptedValue - The encrypted string (format: IV:Ciphertext:Tag).
     * @returns {any} The decrypted configuration value (string, object, array, etc.).
     * @throws {Error} If decryption fails (e.g., bad format, wrong key).
     */
    static getSecret(encryptedValue) {
        if (typeof encryptedValue !== 'string' || encryptedValue.trim() === '') {
            // Return non-string/empty inputs as is, preventing unnecessary key loading/crypto calls.
            return encryptedValue; 
        }
        
        const key = SecureConfigProvider.#getEncryptionKey();
        
        try {
            const decrypted = CryptographicUtil.decryptData(encryptedValue, key);
            
            // Attempt JSON parsing only if the result structurally resembles JSON
            const trimmed = decrypted.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                    return JSON.parse(decrypted);
                } catch (e) {
                    // If JSON parse fails but the structure looked right, return raw string fallback.
                }
            }

            return decrypted;
            
        } catch (error) {
            // Re-throw with clear contextual security failure message
            throw new Error(`[SECURITY DECRYPTION FAILED] Secret decryption failed. Input might be corrupted or encrypted with an incompatible AGI_MEK. Details: ${error.message}`);
        }
    }

    /**
     * Encrypts a configuration value for persistent storage.
     * @param {string|Object|Array|number|boolean} data - The data to encrypt. If non-string, it is serialized to JSON first.
     * @returns {string} The encrypted string (format: IV:Ciphertext:Tag).
     */
    static encryptSecret(data) {
        const key = SecureConfigProvider.#getEncryptionKey();
        
        // Ensure data is stringified for consistent encryption input and matching expected decryption output (JSON.parse attempt)
        const dataToEncrypt = (typeof data === 'object' && data !== null) || typeof data === 'number' || typeof data === 'boolean'
            ? JSON.stringify(data)
            : String(data);

        return CryptographicUtil.encryptData(dataToEncrypt, key);
    }
}