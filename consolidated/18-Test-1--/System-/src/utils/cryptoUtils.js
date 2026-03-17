// src/utils/cryptoUtils.js
const crypto = require('crypto');

/**
 * Utility class for common cryptographic operations required by core governance modules.
 */

const ALGORITHM = 'sha512';
const ENCODING = 'hex';

/**
 * Computes the SHA-512 hash of the given content string, formatted as 'sha512-hashvalue'.
 * @param {string} content - The data content to hash.
 * @returns {string} The computed hash prefixed by the algorithm name.
 */
const sha512 = (content) => {
    if (typeof content !== 'string') {
        throw new Error("Hash input must be a string.");
    }
    try {
        const hash = crypto.createHash(ALGORITHM);
        hash.update(content, 'utf8');
        return `${ALGORITHM}-${hash.digest(ENCODING)}`;
    } catch (e) {
        console.error(`Crypto Utility Failure: Failed to compute ${ALGORITHM} hash.`, e);
        throw new Error("Cryptographic hash generation failed.");
    }
};

module.exports = sha512; // Exporting the function directly for integration into CIM.