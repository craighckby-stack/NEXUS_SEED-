/**
 * DeepNormalizer Utility
 * Provides methods for creating stable, canonical representations of JavaScript objects,
 * ensuring deterministic serialization regardless of key insertion order.
 * Essential for cryptographic hashing (fingerprinting) and reliable comparison.
 */
class DeepNormalizer {

    /**
     * Recursively sorts the keys of an object or array of objects.
     * @param {*} obj 
     * @returns {*} Normalized object/array
     */
    static deepSortKeys(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            // Recursively sort elements in arrays
            return obj.map(DeepNormalizer.deepSortKeys);
        }

        // Handle standard object
        const sortedKeys = Object.keys(obj).sort();
        const sortedObj = {};

        for (const key of sortedKeys) {
            sortedObj[key] = DeepNormalizer.deepSortKeys(obj[key]);
        }

        return sortedObj;
    }

    /**
     * Generates a stable JSON string representation of an object.
     * This is suitable for hashing or canonical comparison.
     * @param {object} obj - The object to stringify.
     * @returns {string} Canonical JSON string.
     */
    static stableStringify(obj) {
        const normalized = DeepNormalizer.deepSortKeys(obj);
        return JSON.stringify(normalized);
    }
}

module.exports = DeepNormalizer;