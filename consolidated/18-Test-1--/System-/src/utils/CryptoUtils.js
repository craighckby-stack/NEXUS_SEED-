import { createHash } from 'crypto';
import ConsensusConfig from '../config/ConsensusConfig';

/**
 * Utility class to enforce the cryptographic standards defined
 * in ConsensusConfig across the application.
 */
export class CryptoUtils {

    /**
     * Calculates the digest hash for a given data buffer or string.
     * Enforces the standard HASH_ALGORITHM defined in configuration.
     * @param {Buffer | string} data - The input data.
     * @returns {string} The hexadecimal hash digest.
     */
    static calculateHash(data) {
        const hash = createHash(ConsensusConfig.HASH.ALGORITHM);
        hash.update(data);
        return hash.digest('hex');
    }

    /**
     * Validates if a public key or signature meets the required byte length standards.
     * @param {Buffer} buffer - The cryptographic element.
     * @param {'public_key' | 'signature'} type - The type to check against config.
     * @returns {boolean}
     */
    static validateSize(buffer, type) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input must be a Buffer.');
        }
        
        let requiredSize;
        if (type === 'public_key') {
            requiredSize = ConsensusConfig.SIGNATURE.PUBLIC_KEY_SIZE_BYTES;
        } else if (type === 'signature') {
            requiredSize = ConsensusConfig.SIGNATURE.SIGNATURE_SIZE_BYTES;
        } else {
            throw new Error(`Unknown crypto size type: ${type}`);
        }

        return buffer.length === requiredSize;
    }
    
    // [Placeholder for signature verification methods, typically handled by an external lib]
}

// Example export for Node environment compatibility
module.exports = CryptoUtils;
