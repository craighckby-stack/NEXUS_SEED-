/**
 * core/config/cryptoConstants.js
 * 
 * Centralized configuration for cryptographic utilities, defining standard
 * algorithms and encoding protocols used across the Sovereign AGI system.
 */

const DEFAULT_HASH_ALGORITHM = 'sha256';
const DEFAULT_STRING_ENCODING = 'utf8';

// A standard list of supported hash algorithms for integrity checks. 
// This should reflect current secure standards enforced by the AGI protocol.
const SUPPORTED_INTEGRITY_ALGORITHMS = [
    'sha256',
    'sha512',
    'blake2b512'
];

module.exports = {
    DEFAULT_HASH_ALGORITHM,
    DEFAULT_STRING_ENCODING,
    SUPPORTED_INTEGRITY_ALGORITHMS
};