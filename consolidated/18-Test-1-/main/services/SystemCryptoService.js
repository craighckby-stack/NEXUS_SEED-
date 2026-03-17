/**
 * SystemCryptoService v1.0.0 (Sovereign AGI)
 * Provides secure cryptographic hashing utilities for verifying system component integrity.
 * This service is critical for auditing configuration manifest (SPDM) integrity.
 */

import { createHash } from 'crypto';

class SystemCryptoService {

    /**
     * Generates a cryptographic hash for data integrity verification.
     * @param {string | Buffer} data - The input data to hash (e.g., stringified JSON).
     * @param {'sha256' | 'sha3-512' | 'sha384'} algorithm - The hashing algorithm to use.
     * @returns {string} The hash digest in hexadecimal format.
     */
    static hash(data, algorithm = 'sha3-512') {
        try {
            // Note: In a pure browser environment, this would use SubtleCrypto.
            // Assuming a Node.js/Server-side execution environment for high-security services.
            if (!['sha256', 'sha3-512', 'sha384'].includes(algorithm)) {
                throw new Error(`Unsupported crypto algorithm: ${algorithm}`);
            }
            
            const hasher = createHash(algorithm);
            hasher.update(data);
            return `0x${hasher.digest('hex')}`;
        } catch (error) {
            console.error("SystemCryptoService failure during hashing:", error);
            throw new Error(`CRITICAL SECURITY FAILURE: Could not generate integrity hash using ${algorithm}.`);
        }
    }

    /**
     * Verifies data integrity against a provided expected hash.
     * @param {string | Buffer} data - The data to check.
     * @param {string} expectedHash - The hash the data must match.
     * @param {'sha256' | 'sha3-512' | 'sha384'} algorithm - The hashing algorithm used.
     * @returns {boolean} True if the hash matches, false otherwise.
     */
    static verifyHash(data, expectedHash, algorithm = 'sha3-512') {
        const computedHash = SystemCryptoService.hash(data, algorithm);
        // Normalize both hashes (remove '0x' prefix if necessary) before comparison
        const normalizedExpected = expectedHash.toLowerCase().replace(/^0x/, '');
        const normalizedComputed = computedHash.toLowerCase().replace(/^0x/, '');
        
        // Use a comparison safe against timing attacks in high-security applications, 
        // though standard comparison suffices for immediate scaffolding.
        return normalizedExpected === normalizedComputed;
    }
}

export default SystemCryptoService;