const fs = require('fs');
const IntegrityHasher = require('../Cryptography/IntegrityHasher'); 

/**
 * core/utils/FileSystem/FileIntegrityManager.js
 * 
 * Manages the calculation and verification of cryptographic integrity hashes for files,
 * utilizing streaming for optimal performance on large datasets/codebases.
 */
class FileIntegrityManager {
    
    /**
     * Calculates the hash of a file located at the specified path.
     * Uses streaming (via IntegrityHasher.calculateStream) for memory efficiency.
     * 
     * @param {string} filePath - Absolute or relative path to the file.
     * @param {string} [algorithm='sha256'] - Hashing algorithm.
     * @returns {Promise<string>} The hash digest in hex format.
     */
    static async hashFile(filePath, algorithm = 'sha256') {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        const hasher = new IntegrityHasher(algorithm);
        const fileStream = fs.createReadStream(filePath);
        
        return hasher.calculateStream(fileStream);
    }

    /**
     * Verifies if the calculated hash of a file matches the expected hash.
     * 
     * @param {string} filePath - Path to the file.
     * @param {string} expectedHash - The hash expected for the file content.
     * @param {string} [algorithm='sha256'] - Hashing algorithm (must match the expected hash's algorithm).
     * @returns {Promise<boolean>} True if the hashes match, false otherwise.
     */
    static async verifyFile(filePath, expectedHash, algorithm = 'sha256') {
        const actualHash = await this.hashFile(filePath, algorithm);
        return actualHash === expectedHash;
    }
}

module.exports = FileIntegrityManager;