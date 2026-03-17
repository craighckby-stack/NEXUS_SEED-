const crypto = require('crypto');
const Policy = require('../config/SecurityPolicy');

/**
 * CryptoService v1.0
 * Central utility for all cryptographic operations, enforcing SecurityPolicy standards.
 * Abstracts the Node.js 'crypto' module to ensure consistent algorithm and parameter usage.
 */
class CryptoService {

    /**
     * Generates a secure random buffer of specified length, defaulting to Policy standards.
     * @param {number} [bytes=Policy.KDF.SALT_LENGTH_BYTES] - Length of the buffer in bytes.
     * @returns {Buffer}
     */
    static generateSalt(bytes = Policy.KDF.SALT_LENGTH_BYTES) {
        return crypto.randomBytes(bytes);
    }

    /**
     * Creates a cryptographic hash digest using the Policy's standard INTEGRITY algorithm.
     * @param {string | Buffer} data - Data to hash.
     * @param {BufferEncoding} [encoding=Policy.INTEGRITY.OUTPUT_ENCODING] - Output encoding.
     * @returns {string}
     */
    static hash(data, encoding = Policy.INTEGRITY.OUTPUT_ENCODING) {
        return crypto
            .createHash(Policy.INTEGRITY.ALGORITHM)
            .update(data)
            .digest(encoding);
    }

    /**
     * Performs Key Derivation Function (KDF) using Scrypt parameters defined in the Policy.
     * Used primarily for secure password hashing.
     * @param {string} password - The password string.
     * @param {Buffer} salt - Secure salt buffer.
     * @returns {Promise<Buffer>} The derived key buffer.
     */
    static deriveKey(password, salt) {
        const { ALGORITHM, COST_N, COST_R, COST_P, KEY_LENGTH_BYTES } = Policy.KDF;

        if (ALGORITHM !== 'scrypt') {
            // Add logic here if future policies move to Argon2
            throw new Error(`KDF Algorithm ${ALGORITHM} not yet implemented in service.`);
        }

        return new Promise((resolve, reject) => {
            crypto.scrypt(
                password,
                salt,
                KEY_LENGTH_BYTES,
                { N: COST_N, r: COST_R, p: COST_P },
                (err, derivedKey) => {
                    if (err) return reject(err);
                    resolve(derivedKey);
                }
            );
        });
    }

    // NOTE: Encryption and Signature methods (using Policy.ENCRYPTION and Policy.SIGNATURE) 
    // should be added here later to complete the cryptographic abstraction layer.
}

module.exports = CryptoService;