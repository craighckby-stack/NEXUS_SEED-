const crypto = require('crypto');

/**
 * Utility module for generating cryptographic hashes used in versioning and integrity checks.
 * Used by SchemaConfigRegistry for robust, content-aware versioning.
 */
class IntegrityUtils {
    /**
     * Calculates the SHA-256 hash of provided content.
     * @param {(string|object)} content - The content to hash. If an object, it is JSON.stringified.
     * @returns {Promise<string>} The SHA-256 hash digest (hexadecimal).
     */
    static async calculateContentHash(content) {
        let dataToHash = content;
        if (typeof content !== 'string') {
            try {
                dataToHash = JSON.stringify(content);
            } catch (e) {
                throw new Error("IntegrityUtils: Failed to stringify content for hashing.");
            }
        }
        
        return new Promise((resolve, reject) => {
            try {
                const hash = crypto.createHash('sha256');
                hash.update(dataToHash, 'utf8');
                resolve(hash.digest('hex'));
            } catch (error) {
                reject(new Error(`Integrity hashing failed: ${error.message}`));
            }
        });
    }
}

module.exports = IntegrityUtils;