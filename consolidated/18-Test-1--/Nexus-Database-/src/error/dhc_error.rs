use std::io;

#[derive(Debug, thiserror::Error)]
pub enum DHCError {
    #[error("Configuration loading failed: {0}")]
    ConfigurationLoadingFailed(#[source] io::Error),
    
    #[error("Manifest hash mismatch (GAX III integrity check failed).")]
    ManifestHashMismatch,
    
    #[error("Deterministic harvest failed during source processing: {0}")]
    HarvestFailure(String),
    
    #[error("Input/Output error: {0}")]
    IOError(#[from] io::Error),
}