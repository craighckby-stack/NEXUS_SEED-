/**
 * Configuration map defining fields that must be excluded from canonicalization 
 * before cryptographic hashing, based on G0_Rules (e.g., transient timestamps, signatures).
 * Keys are payload types (e.g., 'TRANSACTION'), values are arrays of dot-notation paths.
 */
const HASH_EXCLUSION_CONFIG = {
    // Placeholder configuration for execution stability
    'TRANSACTION': [
        'metadata.timestamp',
        'signature'
    ],
    'STATE_UPDATE': [
        'auditTrail.lastModified'
    ]
};

module.exports = HASH_EXCLUSION_CONFIG;