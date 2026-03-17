const fs = require('fs');
const crypto = require('crypto');

// GAX III Standard Hashing Parameters
const HASH_ALGORITHM = 'sha256';
const HASH_LENGTH = 64; // SHA-256 length

/**
 * GAX Hash Utility
 * Provides standardized, high-integrity methods for calculating cryptographic hashes 
 * of critical system artifacts using GAX III prescribed algorithms (SHA-256).
 */
class GAXHashUtility {
    
    /**
     * Calculates the SHA-256 hash of a file synchronously.
     * Used primarily during the G0 Sealing initialization phase.
     * @param {string} filePath Absolute or relative path to the artifact file.
     * @returns {string} The 64 character hex hash string.
     * @throws {Error} If file cannot be read.
     */
    static calculateFileHashSync(filePath) {
        try {
            const buffer = fs.readFileSync(filePath);
            const hash = crypto.createHash(HASH_ALGORITHM);
            hash.update(buffer);
            return hash.digest('hex');
        } catch (error) {
            throw new Error(`GAX Hash Failure: Cannot read artifact file ${filePath}. Reason: ${error.message}`);
        }
    }
    
    /**
     * Calculates the SHA-256 hash of a file asynchronously.
     * Preferred for runtime attestation checks (CDA) or large configuration artifacts.
     * @param {string} filePath Absolute or relative path to the artifact file.
     * @returns {Promise<string>} The 64 character hex hash string.
     */
    static async calculateFileHashAsync(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(HASH_ALGORITHM);
            const stream = fs.createReadStream(filePath);

            stream.on('error', (err) => {
                reject(new Error(`GAX Hash Failure (Async): Cannot stream artifact file ${filePath}. Reason: ${err.message}`));
            });

            stream.on('data', (chunk) => {
                hash.update(chunk);
            });

            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });
        });
    }

    /**
     * Validate a hash string against GAX standards.
     * @param {string} hashString 
     * @returns {boolean}
     */
    static validateHash(hashString) {
        return hashString && hashString.length === HASH_LENGTH && /^[0-9a-fA-F]{64}$/.test(hashString);
    }

    /**
     * Provides the expected length for G0 Seals.
     */
    static get hashLength() {
        return HASH_LENGTH;
    }
    
    /**
     * Provides the algorithm used for G0 Seals.
     */
    static get algorithm() {
        return HASH_ALGORITHM;
    }
}

module.exports = GAXHashUtility;