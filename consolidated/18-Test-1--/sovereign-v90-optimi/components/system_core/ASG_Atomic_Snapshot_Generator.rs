use crate::core::security::CRoT; 
use std::time::{Instant, SystemTime, UNIX_EPOCH, Duration};
use std::fmt;

// --- Configuration Constants & Types ---
pub const INTEGRITY_HASH_SIZE: usize = 64; // Standard size for high-assurance (e.g., SHA-512)
pub type IntegrityHash = [u8; INTEGRITY_HASH_SIZE];

const RSCM_PACKAGE_VERSION: u16 = 1; // Initial version for tracking structural evolution
pub const DEFAULT_CONTEXT_FLAG_GSEP_C: u32 = 0x42; // General System Execution Policy - Default Confidentiality Flag
const HASHING_PROTOCOL_ID: u8 = 0x01; // 0x01 signifies fixed-output SHA-512 based hash implemented via CRoT

// AGI Integrity Enforcement: Canonical size check for metadata hashing
const METADATA_CANONICAL_SIZE: usize = 31; 

// AGI Architectural Improvement: Define configurable parameters for snapshot generation
#[derive(Debug, Clone, Copy)]
pub struct SnapshotConfiguration {
    /// Maximum allowed duration for the snapshot process (temporal constraint).
    pub max_duration: Duration,
    /// Context flags to be applied to the package (used as default or baseline).
    pub default_context_flags: u32,
    /// Minimum free memory or resource buffer required for capture (u64 bytes) to pass pre-flight check.
    pub minimum_resource_buffer_bytes: u64,
    /// AGI Governance: Maximum size (bytes) allowed for the volatile memory dump payload. 
    /// Ensures snapshots remain 'atomic' and rapid.
    pub max_volatile_data_bytes: u64,
}

impl Default for SnapshotConfiguration {
    fn default() -> Self {
        SnapshotConfiguration {
            max_duration: Duration::from_micros(5000), // 5ms default
            default_context_flags: DEFAULT_CONTEXT_FLAG_GSEP_C,
            minimum_resource_buffer_bytes: 1024 * 1024 * 10, // 10MB default buffer
            max_volatile_data_bytes: 1024 * 1024 * 50, // 50MB max default payload
        }
    }
}

impl SnapshotConfiguration {
    /// AGI Governance Check: Ensures the configuration meets baseline security/performance rules.
    pub fn validate(&self) -> Result<(), SnapshotError> {
        // Must have a temporal constraint boundary
        if self.max_duration.as_nanos() == 0 {
            return Err(SnapshotError::ConfigurationInvalid(
                "max_duration must be positive (> 0ns)".to_string()
            ));
        }
        // Ensure a minimum resource buffer is configured for resilience
        if self.minimum_resource_buffer_bytes == 0 {
             return Err(SnapshotError::ConfigurationInvalid(
                "minimum_resource_buffer_bytes must be non-zero for resilience".to_string()
            ));
        }
        // AGI Governance Check: Ensure the volatile data limit is reasonable
        if self.max_volatile_data_bytes == 0 {
             return Err(SnapshotError::ConfigurationInvalid(
                "max_volatile_data_bytes must be positive to prevent excessive capture size".to_string()
            ));
        }
        Ok(())
    }
}

// --- Trait Definitions for Dependency Injection ---

/// Abstract API for system-level data capture. Enforces temporal requirements.
pub trait SystemCaptureAPI: Send + Sync + 'static {
    /// Checks for necessary execution privileges (e.g., kernel mode, specific capabilities).
    fn check_privilege() -> bool;
    
    // AGI Logic Improvement: Add pre-flight check for resource resilience.
    /// Performs a quick check to ensure necessary memory/CPU resources are available 
    /// based on the required configuration limits before starting the critical capture phase.
    /// Default implementation returns Ok, concrete systems must provide implementation for resource checks.
    fn pre_flight_check(config: &SnapshotConfiguration) -> Result<(), SnapshotError> {
        let _ = config; 
        Ok(())
    }
    
    /// Retrieves a high-resolution system timestamp (Epoch nanoseconds). 
    /// Implementations should prioritize monotonic and high-speed clock reading.
    /// NOTE: For kernel/secure environments, this default implementation using SystemTime 
    /// must be replaced with hardware-backed clock access for true temporal integrity.
    fn get_current_epoch_ns() -> u64 {
        SystemTime::now().duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos() as u64
    }
    
    /// Performs low-level, atomic memory capture of predefined volatile regions.
    fn capture_volatile_memory() -> Result<Vec<u8>, ()>;
    
    /// Captures the execution stack trace quickly.
    fn capture_execution_stack() -> String;
}

// AGI Logic Improvement: Formalize metadata structure for consistent hashing.
// This ensures a canonical serialization order for integrity checks.
#[derive(Debug)]
struct RscmPackageMetadata {
    capture_version: u16,
    absolute_capture_ts_epoch_ns: u64,
    context_flags: u32,
    hashing_protocol_id: u8,
    // AGI Improvement: Anchor the size of the volatile data for structural integrity check
    volatile_data_size: u64,
    // AGI Logic/Integrity Improvement: Bind latency directly to the hash input
    capture_latency_ns: u64,
}

impl RscmPackageMetadata {
    /// Serializes the critical metadata fields into a canonical, ordered byte vector
    /// using little-endian encoding, ensuring deterministic input for the cryptographic hash.
    fn to_canonical_bytes(&self) -> Result<Vec<u8>, SnapshotError> {
        // Expected fixed size: 31 bytes (2+8+4+1+8+8)
        let expected_size = METADATA_CANONICAL_SIZE;
        let mut bytes = Vec::with_capacity(expected_size);

        // 1. Package Version (u16)
        bytes.extend_from_slice(&self.capture_version.to_le_bytes());
        // 2. Absolute Capture Timestamp (u64)
        bytes.extend_from_slice(&self.absolute_capture_ts_epoch_ns.to_le_bytes());
        // 3. Context Flags (u32)
        bytes.extend_from_slice(&self.context_flags.to_le_bytes());
        // 4. Hashing Protocol ID (u8)
        bytes.extend_from_slice(&self.hashing_protocol_id.to_le_bytes());
        // 5. Volatile Data Size (u64)
        bytes.extend_from_slice(&self.volatile_data_size.to_le_bytes()); 
        // 6. Capture Latency (u64)
        bytes.extend_from_slice(&self.capture_latency_ns.to_le_bytes());

        if bytes.len() != expected_size {
             // Structural encoding failure
             return Err(SnapshotError::MetadataEncodingFailed); 
        }

        Ok(bytes)
    }
}

// Defines the output structure for the immutable state capture
#[derive(Debug, Clone)] 
pub struct RscmPackage {
    capture_version: u16, 
    absolute_capture_ts_epoch_ns: u64,
    capture_latency_ns: u64,
    integrity_hash: IntegrityHash, 
    volatile_memory_dump: Vec<u8>,
    stack_trace: String,
    context_flags: u32,
    // AGI Improvement: Store the Hashing Protocol ID within the package itself 
    // for self-contained validation context.
    hashing_protocol_id: u8,
    // AGI Improvement: Store data size for structural integrity validation
    volatile_data_size: u64,
}

impl RscmPackage {
    // Constructor used exclusively by the generator function
    fn new(
        absolute_ts: u64,
        latency_ns: u64,
        hash: IntegrityHash,
        vm_dump: Vec<u8>,
        trace: String,
        context_flags: u32,
        hashing_protocol_id: u8,
        volatile_data_size: u64,
    ) -> Self {
        RscmPackage {
            capture_version: RSCM_PACKAGE_VERSION,
            absolute_capture_ts_epoch_ns: absolute_ts,
            capture_latency_ns: latency_ns,
            integrity_hash: hash,
            volatile_memory_dump: vm_dump,
            stack_trace: trace,
            context_flags,
            hashing_protocol_id,
            volatile_data_size,
        }
    }

    // Public accessors for reading critical metadata
    pub fn capture_version(&self) -> u16 { self.capture_version }
    pub fn absolute_capture_ts_epoch_ns(&self) -> u64 { self.absolute_capture_ts_epoch_ns }
    pub fn capture_latency_ns(&self) -> u64 { self.capture_latency_ns }
    pub fn context_flags(&self) -> u32 { self.context_flags }
    pub fn hashing_protocol_id(&self) -> u8 { self.hashing_protocol_id }
    pub fn volatile_data_size(&self) -> u64 { self.volatile_data_size }
    
    // Controlled accessors for sensitive data
    pub fn integrity_hash(&self) -> &IntegrityHash { &self.integrity_hash }
    pub fn volatile_memory_dump(&self) -> &[u8] { self.volatile_memory_dump.as_ref() }
    pub fn stack_trace(&self) -> &str { self.stack_trace.as_ref() }
}


#[derive(Debug)]
pub enum SnapshotError {
    PrivilegeRequired,
    MemoryCaptureFailed,
    ResourceConstraintViolated(String), // Error for pre-flight check failure
    ConfigurationInvalid(String), // New error for self-validation failure
    Timeout { actual_duration_ns: u64, max_duration_ns: u64 }, // Enhanced error to include configured limit
    IntegrityHashingFailed,
    HashingOutputMismatch { expected: usize, actual: usize }, // Enhanced error for verification
    // AGI Improvement: Added error variant for structural mismatch, critical for integrity
    MetadataEncodingFailed,
    // AGI Logic Improvement: New error variant for exceeding size limits
    VolatileDataSizeExceeded { actual: u64, limit: u64 },
}

// Implementation for standardized error handling (AGI Logic Improvement)
impl fmt::Display for SnapshotError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            SnapshotError::PrivilegeRequired => write!(f, "Privilege required to perform atomic snapshot."),
            SnapshotError::MemoryCaptureFailed => write!(f, "Low-level memory capture failed."),
            SnapshotError::ResourceConstraintViolated(msg) => write!(f, "Pre-flight resource check failed: {}", msg),
            SnapshotError::ConfigurationInvalid(msg) => write!(f, "Snapshot configuration validation failed: {}", msg),
            SnapshotError::Timeout { actual_duration_ns, max_duration_ns } => write!(f, "Snapshot exceeded temporal constraint ({} ns max). Actual latency: {} ns.", max_duration_ns, actual_duration_ns),
            SnapshotError::IntegrityHashingFailed => write!(f, "Cryptographic integrity hashing failed."),
            SnapshotError::HashingOutputMismatch { expected, actual } => write!(f, "Integrity hash size mismatch. Expected {} bytes, got {} bytes.", expected, actual),
            SnapshotError::MetadataEncodingFailed => write!(f, "Failed to encode critical metadata components for hashing."),
            SnapshotError::VolatileDataSizeExceeded { actual, limit } => write!(f, "Volatile memory capture size exceeded limit ({} bytes max). Actual size: {} bytes.", limit, actual),
        }
    }
}

impl std::error::Error for SnapshotError {}

/// AGI Logic Improvement: Isolated complex cryptographic protocol sequence into a helper.
/// This enforces auditability and improves the logical clarity of the main generator function.
fn calculate_integrity_hash(
    vm_dump: &[u8],
    trace: &str,
    absolute_ts: u64,
    volatile_data_size: u64,
    context_flags: u32,
    capture_latency_ns: u64,
) -> Result<IntegrityHash, SnapshotError> {
    // Use CRoT implementation tailored for fixed-output integrity
    let mut hasher = CRoT::new_hasher_fixed_output(INTEGRITY_HASH_SIZE)
        .map_err(|_| SnapshotError::IntegrityHashingFailed)?; 

    // --- Integrity Hashing Protocol (Formalized using Canonical Metadata) ---
    // Order: Volatile Data, Stack Trace, Canonical Metadata Block.
    
    hasher.update(vm_dump);
    hasher.update(trace.as_bytes());
    
    // Construct canonical metadata structure.
    let metadata = RscmPackageMetadata {
        capture_version: RSCM_PACKAGE_VERSION,
        absolute_capture_ts_epoch_ns: absolute_ts,
        context_flags,
        hashing_protocol_id: HASHING_PROTOCOL_ID,
        volatile_data_size, 
        capture_latency_ns, // Bound to metadata
    };

    // Serialize metadata into guaranteed byte order for hashing.
    let metadata_bytes = metadata.to_canonical_bytes()?; 
    hasher.update(&metadata_bytes);
    
    let raw_hash = hasher.finalize().map_err(|_| SnapshotError::IntegrityHashingFailed)?; 

    // Validate hash integrity size
    if raw_hash.len() != INTEGRITY_HASH_SIZE {
        return Err(SnapshotError::HashingOutputMismatch { 
            expected: INTEGRITY_HASH_SIZE, 
            actual: raw_hash.len() 
        });
    }

    let mut integrity_hash: IntegrityHash = [0; INTEGRITY_HASH_SIZE];
    integrity_hash.copy_from_slice(&raw_hash);
    
    Ok(integrity_hash)
}

/// Generates an immutable, temporally constrained state snapshot (RSCM Package).
/// Requires a specific implementation of SystemCaptureAPI for its environment.
/// AGI Logic Improvement: Accepts runtime configuration for versatile usage and resource control.
pub fn generate_rscm_snapshot<T: SystemCaptureAPI>(
    config: &SnapshotConfiguration,
    runtime_context_flags: u32
) -> Result<RscmPackage, SnapshotError> {
    let start_time = Instant::now();

    // AGI Governance Check: 1. Validate configuration parameters first
    config.validate()?;

    // 2. Privilege and resource pre-check
    if !T::check_privilege() {
        return Err(SnapshotError::PrivilegeRequired);
    }
    
    // AGI Logic Improvement: Resource Pre-check (Fail Fast)
    T::pre_flight_check(config)
        .map_err(|e| SnapshotError::ResourceConstraintViolated(e.to_string()))?;

    let absolute_ts = T::get_current_epoch_ns();
    
    // 3. Perform atomic read of key memory regions
    let vm_dump = T::capture_volatile_memory().map_err(|_| SnapshotError::MemoryCaptureFailed)?;
    
    let volatile_data_size = vm_dump.len() as u64; // Capture size for metadata integrity

    // AGI Logic Improvement: Post-capture size constraint enforcement (New Check)
    if volatile_data_size > config.max_volatile_data_bytes {
         return Err(SnapshotError::VolatileDataSizeExceeded {
            actual: volatile_data_size,
            limit: config.max_volatile_data_bytes,
        });
    }

    let trace = T::capture_execution_stack();
    let context_flags: u32 = runtime_context_flags; // Use provided flags

    // Calculate duration immediately after capture for hashing.
    let duration = start_time.elapsed();
    let latency_ns = duration.as_nanos() as u64;
    let max_duration_ns = config.max_duration.as_nanos() as u64;

    if duration > config.max_duration {
        // Failure to meet temporal constraint (5ms max)
        return Err(SnapshotError::Timeout { 
            actual_duration_ns: latency_ns,
            max_duration_ns,
        });
    }

    // 4. Calculate Integrity Hash using the isolated, canonical protocol.
    let integrity_hash = calculate_integrity_hash(
        &vm_dump,
        &trace,
        absolute_ts,
        volatile_data_size,
        context_flags,
        latency_ns, // Pass measured latency for integrity binding
    )?;
    
    // 5. Final RSCM object creation using the controlled constructor
    Ok(RscmPackage::new(
        absolute_ts,
        latency_ns,
        integrity_hash,
        vm_dump,
        trace,
        context_flags,
        HASHING_PROTOCOL_ID,
        volatile_data_size,
    ))
}