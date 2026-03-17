/**
 * Sovereign AGI v94.1 JSON Canonicalization Utility
 * Ensures a consistent, deterministic string representation of JSON objects
 * suitable for cryptographic operations (signing, hashing).
 */
const crypto = require('crypto');

class JsonCanonicalizer_Util {
    
    /**
     * Recursively sorts keys within an object to ensure deterministic JSON serialization.
     * @param {Object} obj - The object or array to sort.
     * @returns {Object} The deeply sorted structure.
     */
    static _deepSortKeys(obj) {
        if (Array.isArray(obj)) {
            return obj.map(JsonCanonicalizer_Util._deepSortKeys);
        }
        if (obj !== null && typeof obj === 'object') {
            const sortedKeys = Object.keys(obj).sort();
            const newObj = {};
            for (const key of sortedKeys) {
                newObj[key] = JsonCanonicalizer_Util._deepSortKeys(obj[key]);
            }
            return newObj;
        }
        return obj;
    }

    /**
     * Creates a canonical string representation of a JavaScript object (strict key order, no spacing).
     * @param {Object} data - The object to canonicalize.
     * @returns {string} The canonical JSON string.
     */
    static canonicalize(data) {
        const sortedData = JsonCanonicalizer_Util._deepSortKeys(data);
        // Canonical format: Strict JSON, no spacing, ordered keys.
        return JSON.stringify(sortedData);
    }
    
    /**
     * Generates a cryptographic hash (SHA-256) of the canonical string representation.
     * @param {string} canonicalString - The canonical JSON string.
     * @returns {string} The resulting SHA-256 hash (hex).
     */
    static hash(canonicalString) {
        return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
    }
}

module.exports = JsonCanonicalizer_Util;