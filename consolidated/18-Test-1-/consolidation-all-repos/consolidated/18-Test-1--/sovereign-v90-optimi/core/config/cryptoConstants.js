/**
 * core/config/cryptoConstants.js
 * 
 * Centralized configuration for cryptographic utilities, defining standard
 * algorithms and encoding protocols used across the Sovereign AGI system.
 * 
 * NOTE: These constants serve as the canonical source for default values 
 * and supported algorithms. Access and validation should typically be performed 
 * through the CanonicalCryptoConfigUtility plugin.
 */

/**
 * Synchronously defines and freezes the configuration map for cryptographic utilities.
 * This encapsulates the synchronous data preparation logic for architectural consistency.
 * @returns {Readonly<object>} The immutable CryptoConstants configuration.
 */
function _defineCryptoConstants() {
    /**
     * A standard list of supported hash algorithms for integrity checks. 
     * This list reflects current secure standards enforced by the AGI protocol.
     * Frozen for immutability.
     * @type {ReadonlyArray<string>}
     */
    const SUPPORTED_INTEGRITY_ALGORITHMS = Object.freeze([
        'sha256',
        'sha512',
        'blake2b512'
    ]);

    /**
     * Immutable object encapsulating all cryptographic constants.
     * This structure is rigorously frozen to guarantee configuration consistency.
     */
    const CryptoConstants = Object.freeze({
        DEFAULT_HASH_ALGORITHM: 'sha256',
        DEFAULT_STRING_ENCODING: 'utf8',
        SUPPORTED_INTEGRITY_ALGORITHMS: SUPPORTED_INTEGRITY_ALGORITHMS
    });

    return CryptoConstants;
}

const CryptoConstants = _defineCryptoConstants();

module.exports = CryptoConstants;