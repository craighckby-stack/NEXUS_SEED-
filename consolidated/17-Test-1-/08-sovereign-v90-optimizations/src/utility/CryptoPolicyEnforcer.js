/**
 * CryptoPolicyEnforcer Utility
 * Purpose: Ensures all cryptographic operations adhere strictly to the defined SecurityPolicy.
 * Acts as the centralized interface for key generation, hashing, and encryption utilities,
 * preventing modules from utilizing non-compliant or incorrectly sized cryptographic primitives.
 */

import { PolicyDrivenCryptoTool } from '@plugins';
const SecurityPolicy = require('../config/SecurityPolicy');

class CryptoPolicyEnforcer {

    /**
     * Generates cryptographic random bytes based on specified policy length.
     * @param {number} length - The required length in bytes (e.g., SALT_LENGTH, IV_SIZE).
     * @returns {Buffer}
     */
    static generateRandom(length: number): Buffer {
        return PolicyDrivenCryptoTool.generateRandomBytes(length);
    }

    /**
     * Creates a policy-compliant initialization vector (IV) for symmetric encryption.
     * @returns {Buffer}
     */
    static generateIV(): Buffer {
        return this.generateRandom(SecurityPolicy.ENCRYPTION.IV_SIZE);
    }

    /**
     * Hashes data using the mandated INTEGRITY policy algorithm (SHA3-512).
     * @param {Buffer | string} data - The data to hash.
     * @returns {string} The hashed digest, encoded as per policy.
     */
    static createIntegrityHash(data: Buffer | string): string {
        return PolicyDrivenCryptoTool.hash(data, SecurityPolicy.INTEGRITY);
    }

    /**
     * Generates a policy-compliant salt for password hashing/KDF.
     * @returns {Buffer}
     */
    static generateKDFSalt(): Buffer {
        return this.generateRandom(SecurityPolicy.KDF.SALT_LENGTH);
    }

    /**
     * Applies the KDF policy (Scrypt) to derive a key from a secret.
     * @param {Buffer | string} secret - The input secret (e.g., password).
     * @param {Buffer} salt - The salt buffer.
     * @returns {Promise<Buffer>} The derived key.
     */
    static async deriveKeyFromKDF(secret: Buffer | string, salt: Buffer): Promise<Buffer> {
        // The tool handles algorithm checking and scrypt execution using policy parameters.
        return PolicyDrivenCryptoTool.deriveKey(secret, salt, SecurityPolicy.KDF);
    }
}

module.exports = CryptoPolicyEnforcer;