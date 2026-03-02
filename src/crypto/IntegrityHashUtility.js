const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * IntegrityHashUtility
 * Provides standardized, consistent cryptographic hashing functions for
 * Governance Artifact attestation (GAX III requirement).
 * Ensures that all subsystems calculating hashes for GAR attestation use the same protocol.
 * Uses streams internally for efficient asynchronous file processing.
 */
class IntegrityHashUtility {

    // --- Configuration Constants ---
    // These should ideally be driven by a centralized SecurityPolicy configuration.
    static ALGORITHM = 'sha256';
    static ENCODING = 'hex';
    // Length of SHA-256 hash in hex characters (32 bytes * 2).
    static HASH_LENGTH_HEX = 64; 

    /**
     * Calculates the cryptographic hash of raw data (Buffer or string).
     * @param {Buffer | string} data The content to hash.
     * @returns {string} The SHA-256 hash (64 characters).
     * @throws {Error} If data is null or undefined.
     */
    static hashData(data) {
        if (data === null || data === undefined) {
            throw new Error("IntegrityHashUtility: Cannot hash null or undefined data.");
        }
        return crypto.createHash(IntegrityHashUtility.ALGORITHM)
            .update(data)
            .digest(IntegrityHashUtility.ENCODING);
    }

    /**
     * Calculates the hash of a file synchronously.
     * WARNING: Reads the entire file into memory. Only use for small config files or startup checks.
     * @param {string} filePath Absolute or relative path to the file.
     * @returns {string} The SHA-256 hash.
     * @throws {Error} If file access fails.
     */
    static hashFileSync(filePath) {
        const fullPath = path.resolve(filePath);
        try {
            const data = fs.readFileSync(fullPath);
            return IntegrityHashUtility.hashData(data);
        } catch (error) {
            throw new Error(`Integrity hashing failed for file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Calculates the hash of a file asynchronously (preferred for all file checks).
     * This method uses stream piping for optimal memory management.
     * @param {string} filePath Absolute or relative path to the file.
     * @returns {Promise<string>} Promise resolving to the SHA-256 hash.
     */
    static hashFileAsync(filePath) {
        const fullPath = path.resolve(filePath);
        
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(IntegrityHashUtility.ALGORITHM);
            const stream = fs.createReadStream(fullPath);

            // Catch stream read errors (e.g., file not found)
            stream.on('error', (err) => {
                reject(new Error(`Hash stream read error for ${fullPath}: ${err.message}`));
            });

            // Pipe data through the hash object.
            stream.pipe(hash)
                .on('error', (err) => {
                    // Catch potential errors during piping/hashing phase
                    reject(new Error(`Hash digest calculation error during pipe: ${err.message}`));
                })
                .on('finish', () => {
                    // The hash object has received all input data.
                    try {
                        const result = hash.digest(IntegrityHashUtility.ENCODING);
                        resolve(result);
                    } catch (e) {
                        // Catch final digest calculation failure
                        reject(new Error(`Internal error finalizing hash digest: ${e.message}`));
                    }
                });
        });
    }
    
    /**
     * Validates if a calculated hash matches an expected hash.
     * Enforces consistency in integrity checks and hash length.
     * NOTE: Uses standard string comparison, suitable for integrity verification (non-secret data).
     * @param {string} calculatedHash The newly calculated hash.
     * @param {string} expectedHash The required hash.
     * @returns {boolean} True if the hashes match and are valid lengths.
     */
    static validateHash(calculatedHash, expectedHash) {
        if (typeof calculatedHash !== 'string' || typeof expectedHash !== 'string') {
            return false;
        }

        // Standardize validation against the defined digest length.
        const length = IntegrityHashUtility.HASH_LENGTH_HEX;
        if (calculatedHash.length !== length || expectedHash.length !== length) {
            return false;
        }
        
        return calculatedHash === expectedHash;
    }
    
    /**
     * Retrieves the currently mandated hashing algorithm for external reporting/attestation.
     * @returns {string} The algorithm name.
     */
    static getAlgorithm() {
        return IntegrityHashUtility.ALGORITHM;
    }
}

module.exports = IntegrityHashUtility;