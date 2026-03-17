/**
 * CryptoPolicyEnforcer Utility
 * Purpose: Ensures all cryptographic operations adhere strictly to the defined SecurityPolicy.
 * Acts as the centralized interface for key generation, hashing, and encryption utilities,
 * preventing modules from utilizing non-compliant or incorrectly sized cryptographic primitives.
 */

const SecurityPolicy = require('../config/SecurityPolicy');
const crypto = require('crypto');

class CryptoPolicyEnforcer {

    /**
     * Generates cryptographic random bytes based on specified policy length.
     * @param {number} length - The required length in bytes (e.g., SALT_LENGTH, IV_SIZE).
     * @returns {Buffer}
     */
    static generateRandom(length) {
        if (!Number.isInteger(length) || length <= 0) {
            throw new Error('Invalid length specified for secure random generation.');
        }
        return crypto.randomBytes(length);
    }

    /**
     * Creates a policy-compliant initialization vector (IV) for symmetric encryption.
     * @returns {Buffer}
     */
    static generateIV() {
        return this.generateRandom(SecurityPolicy.ENCRYPTION.IV_SIZE);
    }

    /**
     * Hashes data using the mandated INTEGRITY policy algorithm (SHA3-512).
     * @param {Buffer | string} data - The data to hash.
     * @returns {string} The hashed digest, encoded as per policy.
     */
    static createIntegrityHash(data) {
        const policy = SecurityPolicy.INTEGRITY;
        return crypto.createHash(policy.ALGORITHM)
            .update(data)
            .digest(policy.OUTPUT_ENCODING);
    }

    /**
     * Generates a policy-compliant salt for password hashing/KDF.
     * @returns {Buffer}
     */
    static generateKDFSalt() {
        return this.generateRandom(SecurityPolicy.KDF.SALT_LENGTH);
    }

    /**
     * Applies the KDF policy (Scrypt) to derive a key from a secret.
     * @param {Buffer | string} secret - The input secret (e.g., password).
     * @param {Buffer} salt - The salt buffer.
     * @returns {Promise<Buffer>} The derived key.
     */
    static async deriveKeyFromKDF(secret, salt) {
        const kdf = SecurityPolicy.KDF;
        if (kdf.ALGORITHM !== 'scrypt') {
            // Add support for Argon2 here if policy changes
            throw new Error(`KDF algorithm ${kdf.ALGORITHM} not implemented by enforcer.`);
        }

        return new Promise((resolve, reject) => {
            crypto.scrypt(secret, salt, kdf.KEY_LENGTH, {
                N: kdf.COST_N,
                r: kdf.COST_R,
                p: kdf.COST_P
            }, (err, derivedKey) => {
                if (err) return reject(err);
                resolve(derivedKey);
            });
        });
    }
}

module.exports = CryptoPolicyEnforcer;
