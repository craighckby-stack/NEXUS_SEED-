import { KEY_LENGTH } from '../utils/cryptographicUtil.js';
import { ConfigurationError } from '../errors/ConfigurationError.js';

// Configuration constants
const REQUIRED_KEY_HEX_LENGTH = KEY_LENGTH * 2;
const MASTER_KEY_ENV_VAR = 'AGI_MASTER_KEY';

/**
 * Validates a given cryptographic key string against length and hex requirements.
 * @param {string} keyName - The name of the key (for error reporting).
 * @param {string} key - The key value retrieved from the environment.
 * @throws {ConfigurationError} If the key is invalid.
 */
function validateKey(keyName, key) {
    if (!key) {
        throw new ConfigurationError(
            `${keyName} environment variable is missing. Encryption/Decryption cannot proceed.`,
            { envVar: keyName, issue: 'missing' }
        );
    }

    if (typeof key !== 'string' || key.length !== REQUIRED_KEY_HEX_LENGTH) {
        throw new ConfigurationError(
            `${keyName} must be a ${REQUIRED_KEY_HEX_LENGTH}-character hex string (${KEY_LENGTH} bytes). Current length: ${key.length}.`,
            { envVar: keyName, requiredLength: REQUIRED_KEY_HEX_LENGTH, actualLength: key.length, issue: 'length_mismatch' }
        );
    }

    if (!/^[0-9a-fA-F]+$/.test(key)) {
         throw new ConfigurationError(
            `${keyName} contains non-hexadecimal characters. Key must be purely hexadecimal.`,
            { envVar: keyName, issue: 'invalid_format' }
        );
    }
}

/**
 * Retrieves and validates the AES Master Key (AGI_MASTER_KEY) from environment variables.
 * @returns {string} The validated 64-character hex master key.
 * @throws {ConfigurationError} If the key is missing or invalid.
 */
export function getMasterEncryptionKey() {
    const key = process.env[MASTER_KEY_ENV_VAR];
    validateKey(MASTER_KEY_ENV_VAR, key);
    return key;
}

/**
 * Executes essential cryptographic environment checks on system startup.
 * This ensures the AGI fails fast if core secrets management prerequisites are not met.
 * @throws {ConfigurationError} If validation fails.
 */
export function initializeSecurityChecks() {
    console.log("Security Setup: Validating AGI Master Key configuration...");
    try {
        getMasterEncryptionKey();
        console.log("Security Setup: Master Encryption Key validated successfully.");
    } catch (error) {
        throw error;
    }
}