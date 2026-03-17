// Deterministic Harvester Component (DHC) - Implements GAX I Input Determinism

use crate::error::dhc_error::DHCError;
use protocol::chs_definition::{CHSDefinition, SourceDefinition};
use runtime::isb::InputStateBuffer;

/// The Deterministic Harvester Component (DHC).
/// Responsible for executing cryptographically repeatable data harvesting based on the Epoch ID.
pub struct DHC {
    config: CHSDefinition,
}

impl DHC {
    /// Initializes the DHC by loading the mandatory, hash-locked Context Harvester Spec.
    /// This function performs the GAX III hash integrity check.
    pub fn load_config(path: &str) -> Result<Self, DHCError> {
        // Step 1: Attempt to load the configuration structure.
        let config = CHSDefinition::from_file(path).map_err(DHCError::ConfigurationLoadingFailed)?;

        // Step 2: GAX III Check: Verify manifest hash integrity before use.
        // Assuming 'protocol' exposes a verification utility, or config contains the expected hash.
        if !config.verify_hash_integrity() {
            return Err(DHCError::ManifestHashMismatch);
        }
        
        Ok(DHC { config })
    }

    /// Executes deterministic data harvesting (GSEP-C S01-S06).
    /// Must be cryptographically repeatable based on the current Epoch ID.
    pub fn generate_isb(&self, epoch_id: u64) -> Result<InputStateBuffer, DHCError> {
        tracing::info!("DHC: Starting deterministic harvest for epoch {}", epoch_id);
        
        let mut buffer = InputStateBuffer::new();
        
        for source_def in &self.config.sources {
            let harvested_bytes = self.process_single_source(epoch_id, source_def)?;
            // Optimization: Append must be deterministic, ordered by source definition ID.
            buffer.append_deterministic(harvested_bytes);
        }

        // Final SHA256 hash calculation of the resulting buffer for verification (GAX I guarantee).
        buffer.seal_and_finalize(); 
        tracing::info!("DHC: ISB generation complete. Size: {} bytes.", buffer.size());
        
        Ok(buffer)
    }
    
    /// Handles the entire GSEP-C workflow (Fetch -> Normalize -> Serialize) for a single source.
    fn process_single_source(&self, epoch_id: u64, source_def: &SourceDefinition) -> Result<Vec<u8>, DHCError> {
        // S01. Deterministic Data Fetch (Time/Epoch Locked)
        let raw_data = source_def.fetch_data(epoch_id)
            .map_err(|e| DHCError::HarvestFailure(format!("Failed to fetch data for source {}: {}", source_def.id, e)))?;

        // S02-S03. Data Validation & Normalization (Prescribed Schema)
        let normalized_data = source_def.normalize_data(raw_data)
             .map_err(|e| DHCError::HarvestFailure(format!("Failed to normalize data for source {}: {}", source_def.id, e)))?;

        // S04-S06. Deterministic Encoding and Serialization
        let serialized_bytes = source_def.deterministic_encode(normalized_data)
            .map_err(|e| DHCError::HarvestFailure(format!("Failed to encode data for source {}: {}", source_def.id, e)))?;
        
        Ok(serialized_bytes)
    }
}