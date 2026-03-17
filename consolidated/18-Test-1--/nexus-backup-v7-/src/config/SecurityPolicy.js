/**
 * SecurityPolicy Configuration (Sovereign AGI v94.1)
 * Centralized module for defining system-wide cryptographic and security parameters.
 * Ensures mandatory algorithms, key lengths, and encoding are consistent across all modules.
 * Standard: FIPS 140-3 compliant algorithms (SHA3-512, AES-256-GCM, Scrypt/Argon2 family).
 */

const SecurityPolicy = Object.freeze({
    POLICY_VERSION: 'v94.1-P3', // P3 indicates the third major revision of v94 policies.

    // --- General Standards ---
    DEFAULT_ENCODING: 'hex',
    DEFAULT_TEXT_ENCODING: 'utf8',

    // --- Policy Group: Hashing & Integrity (e.g., for Data Verification, Message Digests) ---
    INTEGRITY: Object.freeze({
        ALGORITHM: 'sha3-512',
        OUTPUT_ENCODING: 'hex',
        // Raw sizes
        SIZE_BYTES: 64, // 512 bits
        SIZE_BITS: 512,
        // Derived size for hex encoding (64 bytes * 2)
        SIZE_HEX_LENGTH: 128
    }),

    // --- Policy Group: Key Encryption (Symmetric Payload Protection) ---
    ENCRYPTION: Object.freeze({
        ALGORITHM: 'aes-256-gcm',
        KEY_SIZE: 32, // Bytes (256 bits)
        IV_SIZE: 12, // Bytes (Standard GCM)
        AUTH_TAG_SIZE: 16, // Bytes (Standard GCM)
        CIPHER_BIT_STRENGTH: 256
    }),

    // --- Policy Group: Key Derivation Function (KDF) / Credential Hashing ---
    KDF: Object.freeze({
        ALGORITHM: 'scrypt',
        // Cost factors optimized for memory hard processing
        COST_N: 16384,
        COST_R: 8,
        COST_P: 1,
        KEY_LENGTH: 64, // Output key length in bytes (512 bits)
        SALT_LENGTH: 32 // Increased salt size for higher entropy (previously 16)
    }),

    // --- Policy Group: Digital Signatures & Asymmetric Operations ---
    // Essential for secure communication, ledger logging, and operational verification.
    SIGNATURE: Object.freeze({
        ALGORITHM: 'Ed25519', // Modern, fast, secure curve standard
        KEY_SIZE_BYTES: 32, // Public Key size (or seed size)
        SIGNATURE_SIZE_BYTES: 64
    })
});

module.exports = SecurityPolicy;
