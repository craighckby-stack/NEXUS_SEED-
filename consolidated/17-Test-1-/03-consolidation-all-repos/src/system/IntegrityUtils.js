/**
 * Utility Component: IntegrityUtils
 * Role: Centralizes and enforces system-wide cryptographic standards and validation rules.
 * Mandate: Ensures policy hashes, ledger data structures, and cryptographic inputs conform 
 *          to mandated security protocols (e.g., SHA-512 length and format).
 */

// Assuming the system standard mandates SHA-512, which is 128 hex characters.
const SHA512_LENGTH = 128;

class IntegrityUtils {

    /**
     * Checks if a given string conforms to the expected system hash standard (SHA-512 hex string).
     * This ensures only cryptographically secure digests are processed by the ledger interface.
     * @param {string} hash - The string to validate.
     * @returns {boolean}
     */
    static isValidPolicyHash(hash) {
        if (typeof hash !== 'string' || hash.length !== SHA512_LENGTH) {
            return false;
        }
        // Strict check for exactly 128 hexadecimal characters.
        return /^[0-9a-fA-F]{128}$/.test(hash);
    }
    
    /**
     * Checks if the provided object maps paths (strings) to valid policy hashes.
     * This is used to validate data retrieved from the SecurePolicyLedgerInterface.
     * @param {Object<string, string>} hashMap
     * @returns {boolean}
     */
    static isValidPolicyHashMap(hashMap) {
        if (typeof hashMap !== 'object' || hashMap === null) {
            return false;
        }
        for (const key in hashMap) {
            if (Object.prototype.hasOwnProperty.call(hashMap, key)) {
                // Key must be a string (path)
                if (typeof key !== 'string' || key.length === 0) return false;
                // Value must be a valid hash
                if (!IntegrityUtils.isValidPolicyHash(hashMap[key])) {
                    return false;
                }
            }
        }
        return true;
    }
}

module.exports = IntegrityUtils;