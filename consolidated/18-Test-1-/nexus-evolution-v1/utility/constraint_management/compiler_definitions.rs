// This file should contain common definitions required by both the Constraint Compiler and the Dynamic Scheduler.

pub type ConstraintSetId = u64;

#[derive(Debug, Clone)]
pub struct CompiledConstraintBlock {
    pub compilation_version: u32,
    // Placeholder fields for compiled artifacts
    pub gax_ii_boundary_checks: Vec<u8>,
    pub gax_iii_input_integrity: Vec<u8>,
}

#[derive(Debug, thiserror::Error)]
pub enum ConstraintError {
    #[error("Compilation failed: {0}")]
    CompilationFailed(String),
    #[error("External dependency failure, potentially thread panic: {0}")]
    ExternalDependencyFailure(String),
    // Add specific constraints/validation errors as needed
}