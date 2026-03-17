/**
 * SecurityPolicy Configuration (Sovereign AGI v94.1)
 * Centralized immutable module for defining system-wide cryptographic standards.
 * Ensures mandatory algorithms, key lengths, and encoding consistency.
 *
 * Mandates FIPS 140-3 compliant algorithms:
 * - Hashing: SHA3-512
 * - Symmetric Encryption: AES-256-GCM
 * - Key Derivation: Scrypt (Memory-hard)
 * - Signatures: Ed25519
 */
const BYTES = Object.freeze({
    // Standard sizes for cryptographic primitives
    KEY_256_BIT: 32,
    KEY_512_BIT: 64,
    SALT_DEFAULT: 32,
    IV_GCM: 12,
    TAG_GCM: 16,
    SIGNATURE_ED25519: 64,
});

const SecurityPolicy = Object.freeze({
    POLICY_VERSION: 'v94.1-P3',

    // --- ENCODING Standards ---
    ENCODING: Object.freeze({
        // Standard encodings for cryptographic output/storage (must be Buffer-compatible)
        OUTPUT_CRYPTO: 'hex',
        OUTPUT_SIGNATURE: 'base64url', // Optimized for transport/URI safety
        INPUT_TEXT: 'utf8',
    }),

    // --- INTEGRITY & Hashing (Data Verification, Digests) ---
    INTEGRITY: Object.freeze({
        ALGORITHM: 'sha3-512',
        OUTPUT_ENCODING: 'hex',
        SIZE_BYTES: BYTES.KEY_512_BIT,
        SIZE_BITS: 512,
        // Hex length: 64 bytes * 2 = 128
        SIZE_HEX_LENGTH: BYTES.KEY_512_BIT * 2
    }),

    // --- SYMMETRIC ENCRYPTION (Payload Protection) ---
    ENCRYPTION: Object.freeze({
        ALGORITHM: 'aes-256-gcm',
        KEY_SIZE_BYTES: BYTES.KEY_256_BIT,
        IV_SIZE_BYTES: BYTES.IV_GCM,
        AUTH_TAG_SIZE_BYTES: BYTES.TAG_GCM,
        BIT_STRENGTH: 256
    }),

    // --- KEY DERIVATION FUNCTION (KDF) / Credential Hashing ---
    KDF: Object.freeze({
        // Chosen for proven memory-hardness and high resistance to parallel attacks.
        ALGORITHM: 'scrypt',
        // Cost factors: N (CPU/Memory cost), R (Block Size), P (Parallelization).
        // N=2^14 (16384) is a common secure baseline.
        COST_N: 16384,
        COST_R: 8,
        COST_P: 1,
        KEY_LENGTH_BYTES: BYTES.KEY_512_BIT, // 512-bit derived key
        SALT_LENGTH_BYTES: BYTES.SALT_DEFAULT,
    }),

    // --- DIGITAL SIGNATURES (Asymmetric Operations, Non-Repudiation) ---
    SIGNATURE: Object.freeze({
        // Ed25519 provides excellent performance and security clarity.
        ALGORITHM: 'Ed25519',
        KEY_SIZE_BYTES: BYTES.KEY_256_BIT, // Private key size / Seed size
        PUBLIC_KEY_SIZE_BYTES: BYTES.KEY_256_BIT,
        SIGNATURE_SIZE_BYTES: BYTES.SIGNATURE_ED25519
    }),

    // --- TRANSPORT LAYER SECURITY (TLS/SSL) STANDARDS ---
    TRANSPORT: Object.freeze({
        MIN_TLS_VERSION: 'TLSv1.3',
        // Mandatory/recommended high-strength cipher suite families
        CIPHER_SUITES_STANDARD: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256'
        ],
        HSTS_MAX_AGE_SECONDS: 31536000 // 1 Year
    })
});

module.exports = SecurityPolicy;
