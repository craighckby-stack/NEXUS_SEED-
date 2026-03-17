/**
 * Recursively sorts object keys alphabetically to ensure deterministic serialization.
 * @param {any} data
 * @returns {any} A structure identical to data, but with sorted object keys.
 */
function canonicalSortKeys(data) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => canonicalSortKeys(item));
    }

    const sortedKeys = Object.keys(data).sort();
    
    return sortedKeys.reduce((sortedObject, key) => {
        sortedObject[key] = canonicalSortKeys(data[key]);
        return sortedObject;
    }, {});
}

/**
 * Ensures consistent, canonical binary serialization of data for signing/hashing.
 * This is crucial for cryptographic determinism and integrity checks.
 * 
 * Process:
 * 1. Handle Buffers/Strings directly.
 * 2. Recursively sort object keys alphabetically (canonicalSortKeys).
 * 3. JSON.stringify the result.
 * 4. Encode as a UTF-8 Buffer.
 * 
 * @param {any} data
 * @returns {Buffer} The serialized buffer (UTF-8 encoded string or raw Buffer).
 */
export function toCanonicalBuffer(data) {
    if (data instanceof Buffer) {
        return data;
    }
    if (typeof data === 'string') {
        return Buffer.from(data, 'utf8');
    }

    // Step 1: Recursively sort complex objects for determinism.
    if (typeof data === 'object' && data !== null) {
        const sortedData = canonicalSortKeys(data);
        // Step 2: Stringify.
        const str = JSON.stringify(sortedData);
        return Buffer.from(str, 'utf8');
    }

    // Handle primitives
    return Buffer.from(String(data), 'utf8');
}