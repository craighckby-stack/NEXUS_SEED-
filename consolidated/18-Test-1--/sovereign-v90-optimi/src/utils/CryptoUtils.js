import ConsensusConfig from '../config/ConsensusConfig';

/**
 * Utility class to enforce the cryptographic standards defined
 * in ConsensusConfig across the application.
 */

// AGI-KERNEL Tool Declarations (Assumed availability in runtime context)
declare const IntegrityHashingUtility: {
    calculateHash: (data: Buffer | string, algorithm: string) => string
};
declare const CryptographicSizeValidator: {
    validate: (buffer: Buffer, type: 'public_key' | 'signature', config: any) => boolean
};

export class CryptoUtils {

    /**
     * Calculates the digest hash for a given data buffer or string.
     * Delegates to IntegrityHashingUtility using the standard HASH_ALGORITHM.
     * @param {Buffer | string} data - The input data.
     * @returns {string} The hexadecimal hash digest.
     */
    static calculateHash(data: Buffer | string): string {
        if (typeof IntegrityHashingUtility === 'undefined' || typeof IntegrityHashingUtility.calculateHash !== 'function') {
            throw new Error("IntegrityHashingUtility not available in runtime environment.");
        }
        // Uses configuration defined algorithm
        return IntegrityHashingUtility.calculateHash(data, ConsensusConfig.HASH.ALGORITHM);
    }

    /**
     * Validates if a public key or signature meets the required byte length standards.
     * Delegates validation to the extracted CryptographicSizeValidator plugin.
     * @param {Buffer} buffer - The cryptographic element.
     * @param {'public_key' | 'signature'} type - The type to check against config.
     * @returns {boolean}
     */
    static validateSize(buffer: Buffer, type: 'public_key' | 'signature'): boolean {
        if (!Buffer.isBuffer(buffer)) {
            // Keeping Buffer check specific to expected Node/Buffer environment
            throw new Error('Input must be a Buffer.');
        }

        if (typeof CryptographicSizeValidator === 'undefined' || typeof CryptographicSizeValidator.validate !== 'function') {
             throw new Error("CryptographicSizeValidator not available in runtime environment.");
        }
        
        // Pass configuration explicitly to the validator plugin
        return CryptographicSizeValidator.validate(buffer, type, ConsensusConfig);
    }
}

// Example export for Node environment compatibility
module.exports = CryptoUtils;
