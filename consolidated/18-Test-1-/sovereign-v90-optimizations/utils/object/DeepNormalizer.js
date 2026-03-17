/**
 * DeepNormalizer Utility
 * Provides methods for creating stable, canonical representations of JavaScript objects,
 * ensuring deterministic serialization regardless of key insertion order.
 * Essential for cryptographic hashing (fingerprinting) and reliable comparison.
 */

// --- Plugin Access Layer ---
// Assumes the plugin 'CanonicalObjectNormalizer' is accessible via a service locator or injection.
declare const PluginAccess: {
    CanonicalObjectNormalizer: {
        normalize: (args: { data: unknown }) => unknown;
    };
};

/**
 * Recursively sorts the keys of an object or array of objects using the CanonicalObjectNormalizer plugin.
 * @param {unknown} obj - The object or array to normalize
 * @returns {unknown} Normalized object/array with sorted keys
 */
const deepSortKeys = (obj: unknown): unknown => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    return PluginAccess.CanonicalObjectNormalizer.normalize({ data: obj });
};

/**
 * Generates a stable JSON string representation of an object.
 * This is suitable for hashing or canonical comparison.
 * @param {object} obj - The object to stringify
 * @returns {string} Canonical JSON string
 */
const stableStringify = (obj: object): string => {
    const normalized = deepSortKeys(obj);
    return JSON.stringify(normalized);
};

export { deepSortKeys, stableStringify };
