const crypto = require('crypto');

/**
 * Utility for ensuring deterministic state serialization and secure hashing.
 * Essential for cryptographic integrity checks across distributed sovereign nodes.
 * Ensures that complex objects yield the exact same hash across all nodes.
 */
class Canonicalizer {

    /**
     * Helper function to recursively traverse an object and sort its keys.
     * This ensures deterministic ordering before JSON serialization, 
     * which is significantly more performant than using the JSON.stringify replacer 
     * for deep objects.
     * @param {*} value
     * @returns {*} Sorted object or original value.
     */
    static #sortKeys(value) {
        if (!value || typeof value !== 'object') {
            return value;
        }

        if (Array.isArray(value)) {
            // Recurse into array elements, arrays themselves maintain insertion order.
            return value.map(Canonicalizer.#sortKeys);
        }

        // Handle standard objects: sort keys alphabetically and recurse
        const sortedKeys = Object.keys(value).sort();
        const sortedObject = {};

        for (const key of sortedKeys) {
            sortedObject[key] = Canonicalizer.#sortKeys(value[key]);
        }
        return sortedObject;
    }

    /**
     * Converts a complex object into a deterministically ordered JSON string 
     * suitable for hashing/signing.
     * @param {object} data 
     * @returns {string} Canonical JSON string.
     */
    static canonicalize(data) {
        // 1. Recursively sort the keys of the input data structure.
        const sortedData = Canonicalizer.#sortKeys(data);
        
        // 2. Stringify the pre-sorted structure. No replacer needed.
        return JSON.stringify(sortedData);
    }

    /**
     * Calculates a secure cryptographic hash of the canonical data.
     * NOTE: Algorithm choice should be standardized via ConsensusConfig.
     * @param {string} canonicalData - Data obtained from canonicalize().
     * @param {string} algorithm - Hashing algorithm (Default: SHA-256).
     * @returns {string} Hexadecimal hash digest.
     */
    static hash(canonicalData, algorithm = 'sha256') {
        if (typeof canonicalData !== 'string') {
             throw new Error("Input to hash must be a canonical string.");
        }
        return crypto
            .createHash(algorithm.toLowerCase())
            .update(canonicalData, 'utf8')
            .digest('hex');
    }
}

module.exports = Canonicalizer;