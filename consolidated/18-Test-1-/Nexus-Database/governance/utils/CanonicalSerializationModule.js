/**
 * Canonical Serialization Module (CSM)
 * Responsible for converting structured configuration objects into a
 * deterministically ordered, byte-for-byte reproducible byte stream.
 * This is crucial for cryptographic attestation (CCH-384 generation) across systems.
 */
class CanonicalSerializationModule {

    /**
     * Serializes an object into a canonical JSON string.
     * Enforces lexicographical key sorting to guarantee hash determinism.
     * @param {Object} configPayload - The M-02 configuration object.
     * @returns {string} The canonical JSON string.
     */
    static serializeToJson(configPayload) {
        if (!configPayload || typeof configPayload !== 'object') {
            return JSON.stringify(configPayload);
        }

        const canonicalize = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(canonicalize);
            }
            if (obj !== null && typeof obj === 'object') {
                // Critical step: Sort keys lexicographically
                const sortedKeys = Object.keys(obj).sort();
                const canonicalObj = {};
                for (const key of sortedKeys) {
                    canonicalObj[key] = canonicalize(obj[key]);
                }
                return canonicalObj;
            }
            return obj;
        };

        const canonicalObject = canonicalize(configPayload);
        return JSON.stringify(canonicalObject);
    }

    /**
     * Converts the canonical JSON string into a guaranteed UTF-8 byte array.
     * @param {Object} configPayload
     * @returns {Uint8Array}
     */
    static getCanonicalBytes(configPayload) {
        const jsonString = this.serializeToJson(configPayload);
        // Must use guaranteed UTF-8 encoding standard (e.g., Node Buffer or TextEncoder)
        if (typeof Buffer !== 'undefined') {
            return new Uint8Array(Buffer.from(jsonString, 'utf8'));
        }
        if (typeof TextEncoder !== 'undefined') {
            return new TextEncoder().encode(jsonString);
        }
        throw new Error("CSM: UTF-8 Encoder not found.");
    }
}

// Enforce immutability and restrict modification.
Object.freeze(CanonicalSerializationModule);
module.exports = CanonicalSerializationModule;