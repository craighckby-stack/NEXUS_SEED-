use crate::components::system_core::ASG_Atomic_Snapshot_Generator::{IntegrityHash, INTEGRITY_HASH_SIZE};

pub type HashResult<T> = Result<T, AtomicHasherError>;

#[derive(Debug)]
pub enum AtomicHasherError {
    InitializationFailed,
    FinalizationFailed,
    InputError,
    SizeMismatch,
}

/// Low-latency, non-allocating hasher interface required by ASG (5ms constraint).
pub trait AtomicHasher: Send {
    /// Feeds data into the hash context.
    fn update(&mut self, data: &[u8]);

    /// Completes the hash and returns the fixed-size byte array.
    /// Must avoid heap allocation for the output structure itself.
    fn finalize(self) -> HashResult<IntegrityHash>;
}

/// Trait implemented by security core (CRoT) to generate compliant hashers.
pub trait AtomicHasherFactory {
    /// Creates a hasher specifically optimized for the fixed size defined by ASG.
    /// Returns an instance of AtomicHasher via Box to allow dynamic dispatch if needed.
    fn new_hasher_fixed_output(expected_size: usize) -> HashResult<Box<dyn AtomicHasher>>; 
}