const INTEGRITY_CONSTANTS = require('../config/IntegrityStandards');
const { REGEX, DEFAULT_KEYS } = INTEGRITY_CONSTANTS;

/**
 * Utility Component: IntegrityUtils
 * Role: Centralizes and enforces system-wide cryptographic standards and data structure validation rules.
 * Mandate: Ensures cryptographic inputs, unique identifiers, and ledger structure conform 
 *          to mandated security protocols (e.g., SHA-512, UUID v4, structured records).
 */
class IntegrityUtils {

    /**
     * Checks if a given string conforms to the expected system hash standard (SHA-512 hex string).
     * @param {*} input - The value to validate.
     * @returns {boolean}
     */
    static isValidSha512Hash(input) {
        if (typeof input !== 'string') {
            return false;
        }
        // Uses configuration regex for standard compliance
        return REGEX.SHA512_HASH.test(input);
    }
    
    /**
     * Alias for domain-specific context.
     * Checks if a Policy Hash conforms to the system standard.
     * @param {*} hash - The policy hash string.
     * @returns {boolean}
     */
    static isValidPolicyHash(hash) {
        return IntegrityUtils.isValidSha512Hash(hash);
    }

    /**
     * Checks if the provided object maps system keys/paths to valid policy hashes.
     * @param {*} hashMap - Object to validate.
     * @returns {boolean}
     */
    static isValidPolicyHashMap(hashMap) {
        // Validate base type: must be a non-null object, and not an array.
        if (typeof hashMap !== 'object' || hashMap === null || Array.isArray(hashMap)) {
            return false;
        }

        for (const [key, value] of Object.entries(hashMap)) {
            // 1. Key validation (Path/ID must be non-empty string)
            if (typeof key !== 'string' || key.length === 0) {
                return false;
            }
            // 2. Value validation (Must be a valid hash)
            if (!IntegrityUtils.isValidSha512Hash(value)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if a string conforms to the required system Unique Identifier standard (UUID v4).
     * @param {*} uuid - The string to validate.
     * @returns {boolean}
     */
    static isValidUuidV4(uuid) {
        if (typeof uuid !== 'string') return false;
        return REGEX.UUID_V4.test(uuid);
    }

    /**
     * Checks if an input is a valid non-negative integer timestamp (milliseconds epoch).
     * @param {*} timestamp - The value to validate.
     * @returns {boolean}
     */
    static isValidTimestamp(timestamp) {
        // Must be a number or BigInt and finite/non-negative.
        if (typeof timestamp !== 'number' && typeof timestamp !== 'bigint') {
            return false;
        }
        return Number.isFinite(timestamp) && timestamp >= 0;
    }

    /**
     * Checks if a common system record structure (used in ledgers, configs, etc.) is intact,
     * ensuring the presence of critical integrity markers (ID, Hash, optional Timestamp).
     * @param {object} record - The structure to validate.
     * @param {string} [hashKey] - Key holding the hash value. (Default: integrityHash)
     * @param {string} [idKey] - Key holding the unique ID. (Default: id)
     * @returns {boolean}
     */
    static isValidIntegrityRecord(record, hashKey = DEFAULT_KEYS.HASH, idKey = DEFAULT_KEYS.ID) {
        if (typeof record !== 'object' || record === null || Array.isArray(record)) {
            return false;
        }
        
        // 1. Validate ID field (Required for traceability)
        if (!IntegrityUtils.isValidUuidV4(record[idKey])) {
            return false; 
        }

        // 2. Validate cryptographic hash field (Required for verifiability)
        if (!IntegrityUtils.isValidSha512Hash(record[hashKey])) {
            return false;
        }
        
        // 3. Validate optional timestamp field
        if (record[DEFAULT_KEYS.TIMESTAMP] !== undefined && !IntegrityUtils.isValidTimestamp(record[DEFAULT_KEYS.TIMESTAMP])) {
             return false;
        }

        return true;
    }
}

module.exports = IntegrityUtils;