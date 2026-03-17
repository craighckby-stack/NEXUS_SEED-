use crate::components::system_core::ASG_Atomic_Snapshot_Generator::{IntegrityHash, INTEGRITY_HASH_SIZE};

/// Standardized result type for atomic hashing operations.
pub type HashResult<T> = Result<T, AtomicHasherError>;

/// Specific errors that can occur during cryptographic hashing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AtomicHasherError {
    /// Failed to initialize the cryptographic context.
    InitializationFailed,
    /// Failed during the final computation step (e.g., internal algorithm failure).
    FinalizationFailed,
    /// Invalid input provided (e.g., zero length or improper formatting).
    InvalidInput,
    /// The resulting hash size did not match the required system integrity size.
    SizeMismatch { expected: usize, actual: usize },
    /// Implementation error or unexpected state during operation.
    InternalError,
}

/// Core interface for high-performance, non-allocating cryptographic hash functions.
/// 
/// Requirements:
/// 1. Must implement `Send` and be suitable for multi-threaded/concurrent systems.
/// 2. Must adhere to strict latency constraints (e.g., < 5ms total execution time).
/// 3. The `finalize` method must ensure the output (`IntegrityHash`) is zero-copy or stack-allocated.
pub trait AtomicHasher: Send + 'static {
    /// Feeds data into the hash context stream. Returns an error if the data is invalid or processing fails.
    fn update(&mut self, data: &[u8]) -> HashResult<()>;

    /// Completes the hashing process and consumes the hasher instance.
    /// Returns the fixed-size system integrity hash.
    fn finalize(self) -> HashResult<IntegrityHash>;
    
    /// Provides the expected output size defined by the system security constants.
    fn expected_size(&self) -> usize {
        INTEGRITY_HASH_SIZE
    }
}

/// Factory trait implemented by the security core (CRoT - Cryptographic Root of Trust)
/// to generate system-compliant `AtomicHasher` instances.
pub trait AtomicHasherFactory: Send + Sync + 'static {
    /// Creates a new `AtomicHasher` instance specifically for generating the fixed-size 
    /// system integrity hash defined by INTEGRITY_HASH_SIZE.
    /// 
    /// Returns a dynamically dispatched `AtomicHasher` wrapped in a Box.
    fn new_integrity_hasher() -> HashResult<Box<dyn AtomicHasher>>; 
}