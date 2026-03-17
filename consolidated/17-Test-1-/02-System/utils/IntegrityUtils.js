const crypto = require('crypto');

/**
 * Core recursive abstraction: Ensures deterministic JSON stringification 
 * by forcing key sorting for objects. This guarantees consistent hashing 
 * regardless of object key insertion order.
 * @param {any} content
 * @returns {string}
 */
const getDeterministicDataString = (content) => {
    if (typeof content === 'string') {
        return content;
    }
    
    // Optimized synchronous stringification with key sorting
    try {
        return JSON.stringify(content, (key, value) => {
            // Apply sorting only to non-array objects
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Recursively sort keys for deterministic serialization
                return Object.keys(value).sort().reduce((sorted, k) => {
                    sorted[k] = value[k];
                    return sorted;
                }, {});
            }
            return value;
        });
    } catch (e) {
        throw new Error("IntegrityUtils: Failed to deterministically stringify content.");
    }
};


/**
 * Utility module for generating cryptographic hashes used in versioning and integrity checks.
 * Used by SchemaConfigRegistry for robust, content-aware versioning.
 */
class IntegrityUtils {
    /**
     * Calculates the SHA-256 hash of provided content.
     * This implementation maximizes efficiency by utilizing synchronous crypto operations 
     * and guarantees robust integrity via deterministic content normalization.
     * 
     * @param {(string|object)} content - The content to hash.
     * @returns {Promise<string>} The SHA-256 hash digest (hexadecimal).
     */
    static async calculateContentHash(content) {
        
        // 1. Data Normalization (Recursive Abstraction Layer)
        let dataToHash;
        try {
            dataToHash = getDeterministicDataString(content);
        } catch (e) {
            // Re-throw stringification errors cleanly
            throw e;
        }

        // 2. Cryptographic Computation (Maximum Efficiency)
        try {
            const hash = crypto.createHash('sha256');
            hash.update(dataToHash, 'utf8');
            
            // Returns synchronously, auto-wrapped in a resolved Promise by 'async' keyword
            return hash.digest('hex');
            
        } catch (error) {
            throw new Error(`Integrity hashing failed during computation: ${error.message}`);
        }
    }
}

module.exports = IntegrityUtils;