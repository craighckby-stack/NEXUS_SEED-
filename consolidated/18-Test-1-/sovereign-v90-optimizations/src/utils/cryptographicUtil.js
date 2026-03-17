/**
 * Placeholder for tool execution, assuming the kernel handles routing.
 * NOTE: In a real AGI environment, this would be an injected dependency or a core utility.
 */
class ToolRunner {
    static execute(toolName, method, args) {
        // This simulates calling the CryptographicServiceTool plugin
        // Since we are running in the kernel environment, the definition of this
        // function is symbolic.
        console.warn(`[ToolRunner] Executing ${toolName}.${method} with args:`, args);
        // A real implementation would execute the defined plugin code.
        throw new Error(`Tool execution environment not fully implemented in facade.`);
    }
}

// Constants are kept for validation and interface documentation
export const ALGORITHM = 'aes-256-gcm';
export const IV_LENGTH = 16;
export const TAG_LENGTH = 16;
export const KEY_LENGTH = 32; // 256 bits
const KEY_HEX_LENGTH = KEY_LENGTH * 2;

/**
 * Standardized cryptographic utility facade for the AGI system.
 * This class delegates all low-level cryptographic operations to the secure CryptographicServiceTool plugin.
 */
export class CryptographicUtil {

    // --- Key and Token Generation ---

    /**
     * Generates a strong, cryptographically secure random key.
     */
    static generateKey(length = KEY_LENGTH) {
        return ToolRunner.execute('CryptographicServiceTool', 'generateKey', { length });
    }

    /**
     * Generates a strong random token.
     */
    static generateToken(length = 32) {
        return ToolRunner.execute('CryptographicServiceTool', 'generateToken', { length });
    }

    // --- Hashing and Integrity ---

    /**
     * Generates a deterministic SHA-256 hash of a JavaScript object/payload.
     * The serialization logic is handled internally by the plugin for consistency.
     */
    static hashObject(data) {
        return ToolRunner.execute('CryptographicServiceTool', 'hashObject', { data });
    }
    
    // --- Symmetric Encryption (AES-256-GCM) ---

    /**
     * Encrypts a payload using AES-256-GCM (Authenticated Encryption).
     */
    static encryptData(payload, encryptionKeyHex) {
        if (encryptionKeyHex.length !== KEY_HEX_LENGTH) {
             throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes (${KEY_HEX_LENGTH} hex characters) for AES-256-GCM.`);
        }
        return ToolRunner.execute('CryptographicServiceTool', 'encryptData', { payload, key: encryptionKeyHex });
    }

    /**
     * Decrypts a payload previously encrypted with AES-256-GCM.
     */
    static decryptData(encryptedData, encryptionKeyHex) {
        if (encryptionKeyHex.length !== KEY_HEX_LENGTH) {
             throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes (${KEY_HEX_LENGTH} hex characters).`);
        }
        return ToolRunner.execute('CryptographicServiceTool', 'decryptData', { encryptedData, key: encryptionKeyHex });
    }

    /**
     * Decrypts data and attempts to parse it as a JSON object.
     */
    static decryptObject(encryptedData, encryptionKeyHex) {
        if (encryptionKeyHex.length !== KEY_HEX_LENGTH) {
             throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes (${KEY_HEX_LENGTH} hex characters).`);
        }
        // The decryptObject logic is moved into the plugin for atomic execution.
        return ToolRunner.execute('CryptographicServiceTool', 'decryptObject', { encryptedData, key: encryptionKeyHex });
    }
}