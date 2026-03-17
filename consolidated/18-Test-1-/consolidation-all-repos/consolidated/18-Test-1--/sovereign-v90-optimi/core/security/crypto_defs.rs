// Defining core cryptographic types to decouple security interfaces from consumer components.

// Placeholder size for system integrity hashes (e.g., 32 for SHA256/Blake3).
// This value MUST match the size requirements of the implementation of IntegrityHash.
pub const STANDARD_INTEGRITY_HASH_SIZE: usize = 32;

// Standardized system integrity hash type.
// Note: Actual system definition may need to use a const generic array if stability is required.
#[cfg(feature = "fixed_size_crypto")]
pub type IntegrityHash = [u8; STANDARD_INTEGRITY_HASH_SIZE];

// --- Utility types may follow ---

// Example: Configuration structure for cryptographic contexts
// pub struct CryptographicContextConfig { ... }