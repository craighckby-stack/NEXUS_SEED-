
declare const CanonicalSerializationUtility: {
    execute: (args: { data: any }) => Buffer;
};

/**
 * Ensures consistent, canonical binary serialization of data for signing/hashing.
 * This is crucial for cryptographic determinism and integrity checks.
 * 
 * Delegates the heavy lifting (key sorting, stringification, encoding) to the CanonicalSerializationUtility plugin.
 * 
 * @param {any} data
 * @returns {Buffer} The serialized buffer (UTF-8 encoded string or raw Buffer).
 */
export function toCanonicalBuffer(data: any): Buffer {
    if (typeof CanonicalSerializationUtility === 'undefined') {
        // Fallback or critical failure in plugin environment
        throw new Error("CanonicalSerializationUtility is required for canonical serialization.");
    }
    
    // The utility handles all required steps: sorting, stringification, and conversion to Buffer.
    return CanonicalSerializationUtility.execute({ data });
}