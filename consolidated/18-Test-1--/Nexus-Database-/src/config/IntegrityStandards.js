/**
 * Configuration File: IntegrityStandards
 * Role: Defines global constants and regex patterns mandated for system integrity and security.
 * This centralizes cryptographic choices and ensures consistency across validators and generators.
 */

const INTEGRITY_CONSTANTS = {
    // Cryptographic Standards
    HASH_ALGORITHM: 'SHA-512',
    SHA512_LENGTH: 128, 

    // Regulatory Expressions
    REGEX: {
        // Enforces SHA-512 hex format (128 characters)
        SHA512_HASH: /^[0-9a-fA-F]{128}$/,
        // Enforces UUID version 4 format
        UUID_V4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    },
    
    // Default key names expected in system records (Ledger Entries, Policies, etc.)
    DEFAULT_KEYS: {
        ID: 'id',
        HASH: 'integrityHash',
        TIMESTAMP: 'timestamp' // Typically epoch milliseconds
    }
};

module.exports = INTEGRITY_CONSTANTS;