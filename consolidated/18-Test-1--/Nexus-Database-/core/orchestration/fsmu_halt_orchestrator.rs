use std::time::Instant;
use tokio::time::{timeout, Duration};

// NOTE: HaltError, HaltContextConfig, and FSMUHaltPolicy definitions assumed/included for completeness.

#[derive(Debug, thiserror::Error)]
pub enum HaltError {
    #[error("Isolation phase failed: {0}")]
    IsolationFailed(String),
    #[error("Forensics collection failed: {0}")]
    ForensicsFailed(String),
    #[error("Memory sanitization failed: {0}")]
    SanitizationFailed(String),
    #[error("The overall halt sequence timed out after {0}ms.")]
    Timeout(u64),
}

pub struct HaltContextConfig {
    pub isolation_sla_ms: u64,
    pub total_timeout_ms: u64,
}

pub struct FSMUHaltPolicy {
    pub policy_id: String,
    pub halt_context: HaltContextConfig,
}

// --- Dependencies via Traits ---

/// Defines the operational interface for low-level system halts (Mandates).
pub trait HaltAgent: Send + Sync {
    async fn execute_isolation_mandate(&self) -> Result<(), HaltError>;
    async fn execute_memory_sanitization(&self) -> Result<(), HaltError>;
    async fn execute_forensics_package(&self) -> Result<(), HaltError>;
}

/// Interface for system logging and telemetry recording.
pub trait SystemLogger: Send + Sync {
    fn record_violation(&self, policy_id: &str, component: &str, duration_ms: u128);
    fn log_info(&self, message: &str);
}

// ----------------------------------------------------------------------
// Refactored FSMUHaltOrchestrator
// ----------------------------------------------------------------------

/// Orchestrates the state machine halt sequence based on FSMUHaltPolicy.
/// Dependencies (Agent and Logger) are injected via generic traits.
pub struct FSMUHaltOrchestrator<'a, T, L>
where
    T: HaltAgent,
    L: SystemLogger,
{
    policy: &'a FSMUHaltPolicy,
    agent: &'a T,
    logger: &'a L,
}

impl<'a, T, L> FSMUHaltOrchestrator<'a, T, L>
where
    T: HaltAgent + 'a,
    L: SystemLogger + 'a,
{
    /// Initializes the orchestrator with the policy, execution agent, and logger.
    pub fn new(policy: &'a FSMUHaltPolicy, agent: &'a T, logger: &'a L) -> Self {
        Self { policy, agent, logger }
    }

    /// Executes the full sequence, handling overall total timeout defined in the policy.
    pub async fn execute_halt_sequence(&self) -> Result<(), HaltError> {
        let total_timeout = self.policy.halt_context.total_timeout_ms;
        self.logger.log_info(&format!("Starting halt sequence (Total Timeout: {}ms)", total_timeout));
        
        let execution = self.run_sequence_internal();

        match timeout(Duration::from_millis(total_timeout), execution).await {
            Ok(result) => result,
            Err(_) => {
                self.logger.log_info("Halt sequence exceeded total system timeout.");
                Err(HaltError::Timeout(total_timeout))
            }
        }
    }

    /// Internal sequence execution logic, manages steps and isolation SLA.
    async fn run_sequence_internal(&self) -> Result<(), HaltError> {
        let start_time = Instant::now();

        // 1. Isolation Phase (SLA Critical)
        self.agent.execute_isolation_mandate().await.map_err(|e| {
            self.logger.log_info(&format!("Isolation mandate failed: {:?}", e));
            e
        })?;
        
        let isolation_duration = start_time.elapsed().as_millis();
        let isolation_sla = self.policy.halt_context.isolation_sla_ms as u128;

        if isolation_duration > isolation_sla {
            self.logger.record_violation(
                &self.policy.policy_id, 
                "Isolation", 
                isolation_duration
            );
        } else {
            self.logger.log_info(&format!(
                "Isolation complete in {}ms (SLA: {}ms)",
                isolation_duration, isolation_sla
            ));
        }

        // 2. Concurrent Forensics and Sanitization
        let (sanitization_result, forensics_result) = tokio::join!(
            self.agent.execute_memory_sanitization(),
            self.agent.execute_forensics_package()
        );

        let sequence_duration = start_time.elapsed().as_millis();

        // Aggregate results, handling specific failure modes
        sanitization_result.map_err(|e| HaltError::SanitizationFailed(e.to_string()))?;
        forensics_result.map_err(|e| HaltError::ForensicsFailed(e.to_string()))?;

        self.logger.log_info(&format!("Halt sequence successfully completed in total duration: {}ms.", sequence_duration));
        
        Ok(())
    }
}