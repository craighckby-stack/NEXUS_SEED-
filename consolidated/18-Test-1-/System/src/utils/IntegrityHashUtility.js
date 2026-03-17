const crypto = require('crypto');
const SecurityPolicy = require('../config/SecurityPolicy');

/**
 * Utility class for calculating and verifying data integrity hashes based on the defined SecurityPolicy.
 * This enforces centralized security standards (currently using SHA3-512) across the system.
 */
class IntegrityHashUtility {

    /**
     * Generates a hash for the given input data according to SecurityPolicy.INTEGRITY.
     * @param {Buffer|string} data - The data to hash.
     * @returns {string} The integrity hash string (hex encoded).
     */
    static generateHash(data) {
        const policy = SecurityPolicy.INTEGRITY;
        
        if (!data) {
            throw new Error("Cannot generate hash for empty input.");
        }

        const hash = crypto.createHash(policy.ALGORITHM);
        
        // Ensure string input is handled correctly
        const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, SecurityPolicy.DEFAULT_TEXT_ENCODING);

        hash.update(inputBuffer);
        
        const generatedHash = hash.digest(policy.OUTPUT_ENCODING);

        // Enforcement check against policy
        if (generatedHash.length !== policy.HASH_LENGTH) {
             throw new Error(`Integrity hash length mismatch. Policy requires ${policy.HASH_LENGTH}, got ${generatedHash.length}.`);
        }

        return generatedHash;
    }

    /**
     * Verifies if the calculated hash of the data matches the expected hash.
     * Uses constant-time comparison when possible.
     * @param {Buffer|string} data - The original data.
     * @param {string} expectedHash - The hash to compare against.
     * @returns {boolean} True if hashes match, false otherwise.
     */
    static verifyHash(data, expectedHash) {
        const calculatedHash = this.generateHash(data);
        
        // Use crypto.timingSafeEqual to mitigate timing attacks
        try {
            // Convert strings to buffers before safe comparison
            const calculatedBuffer = Buffer.from(calculatedHash);
            const expectedBuffer = Buffer.from(expectedHash);

            if (calculatedBuffer.length !== expectedBuffer.length) {
                return false;
            }
            return crypto.timingSafeEqual(calculatedBuffer, expectedBuffer);
        } catch (e) {
            // Fallback for extreme cases (should not happen if policies are followed)
            return calculatedHash === expectedHash;
        }
    }
}

module.exports = IntegrityHashUtility;
