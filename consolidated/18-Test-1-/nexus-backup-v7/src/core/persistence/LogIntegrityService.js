const crypto = require('crypto');

/**
 * Utility function to ensure deterministic JSON serialization by recursively
 * sorting object keys. This is critical for stable hashing.
 * 
 * @param {object} data The object to stringify.
 * @returns {string} Deterministic JSON string.
 */
function stableStringify(data) {
    return JSON.stringify(data, (key, value) => {
        // Recursively find plain objects that are not arrays or primitives.
        if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
            // Create a new object with sorted keys
            return Object.keys(value).sort().reduce((sorted, k) => {
                sorted[k] = value[k];
                return sorted;
            }, {});
        }
        return value;
    });
}

class LogIntegrityService {
    constructor() {
        // Define standard parameters for consistency and easier configuration
        this.ALGORITHM = 'sha256';
        this.ENCODING = 'hex';
    }

    /**
     * Calculates a stable, consistent cryptographic hash for any data structure.
     * Keys are sorted recursively before serialization to ensure platform stability.
     * 
     * @param {object|string} data The data to hash.
     * @returns {string} SHA-256 hash in hexadecimal format.
     */
    calculateStableHash(data) {
        let dataToHash;

        if (typeof data === 'string') {
            dataToHash = data;
        } else if (data === null || typeof data === 'undefined') {
            dataToHash = ''; // Consistent hash for empty/null input
        } else {
            // Use stable stringify for complex objects
            dataToHash = stableStringify(data);
        }

        return crypto.createHash(this.ALGORITHM)
                     .update(dataToHash, 'utf8')
                     .digest(this.ENCODING);
    }

    /**
     * Creates a standard HMAC digest for message authentication using the secret key.
     * 
     * @param {string} secret The shared secret key.
     * @param {string|object} message The data/message to sign.
     * @returns {string} The HMAC digest.
     */
    createHMAC(secret, message) {
        let dataToSign;

        if (typeof message === 'object' && message !== null) {
            dataToSign = stableStringify(message);
        } else if (typeof message === 'string') {
            dataToSign = message;
        } else {
            dataToSign = String(message); // Stringify primitives
        }

        return crypto.createHmac(this.ALGORITHM, secret)
                     .update(dataToSign, 'utf8')
                     .digest(this.ENCODING);
    }
}

module.exports = LogIntegrityService;