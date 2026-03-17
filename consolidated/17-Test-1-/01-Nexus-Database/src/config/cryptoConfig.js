/**
 * src/config/cryptoConfig.js
 * Central configuration for cryptographic parameters used across the system.
 */

export const SIGNATURE_ALGORITHM = 'sha256';
export const SIGNATURE_CURVE = 'prime256v1'; // P-256 ECDSA

// Key Encoding Standards
export const PUBLIC_KEY_ENCODING = {
    type: 'spki', 
    format: 'pem'
};

export const PRIVATE_KEY_ENCODING = {
    type: 'pkcs8', 
    format: 'pem'
};

export default {
    SIGNATURE_ALGORITHM,
    SIGNATURE_CURVE,
    PUBLIC_KEY_ENCODING,
    PRIVATE_KEY_ENCODING
};