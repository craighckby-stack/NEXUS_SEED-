const { CanonicalIntegrityHasher } = require('../plugins/CanonicalIntegrityHasher');

/**
 * Utility module for generating cryptographic hashes used in versioning and integrity checks.
 * Delegates hashing responsibility to the CanonicalIntegrityHasher plugin for robust, content-aware versioning.
 */
class IntegrityUtils {
    /**
     * Calculates the SHA-256 hash of provided content.
     * @param {(string|object)} content - The content to hash. If an object, it will be JSON.stringified.
     * @returns {Promise<string>} The SHA-256 hash digest in hexadecimal format.
     * @throws {Error} If hashing fails.
     */
    static async calculateContentHash(content) {
        try {
            return await CanonicalIntegrityHasher.calculateHash(content);
        } catch (error) {
            throw new Error(`Failed to calculate content hash: ${error.message}`);
        }
    }
}

module.exports = IntegrityUtils;
