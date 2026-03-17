/**
 * Hashing Utility Service
 * Provides standardized, cryptographic hashing capabilities necessary for 
 * integrity verification across the governance and transaction layers.
 */

import { createHash } from 'crypto'; // Assumes Node.js crypto module is available

/**
 * Generates a SHA256 hash of the input data.
 * Supports complex objects by serializing them first.
 * 
 * NOTE: In browser/edge environments, replace 'crypto' import with Web Crypto API implementation.
 * 
 * @param {*} data - The input data (string or object) to be hashed.
 * @param {string} [algorithm='sha256'] - The hashing algorithm to use.
 * @returns {string} The hexadecimal hash digest.
 */
export function calculateHash(data, algorithm = 'sha256') {
    let input;

    if (typeof data !== 'string') {
        // Ensure complex objects are stably serialized (sort keys) for deterministic hashing.
        // Note: For truly robust systems, a specialized JSON canonicalization library is recommended.
        try {
            input = JSON.stringify(data, Object.keys(data).sort());
        } catch (e) {
            throw new Error("Cannot serialize data for hashing: " + e.message);
        }
    } else {
        input = data;
    }

    try {
        return createHash(algorithm)
            .update(input, 'utf8')
            .digest('hex');
    } catch (e) {
        // Catch if algorithm is unsupported or environment lacks crypto
        throw new Error(`Hashing failed with algorithm ${algorithm}: ${e.message}`);
    }
}