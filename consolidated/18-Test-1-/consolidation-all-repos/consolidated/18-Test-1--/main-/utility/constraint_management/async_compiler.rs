use tokio::sync::mpsc;
use tracing::{info, error, instrument};
use std::time::Instant;

use crate::utility::dynamic_constraint_scheduler::{ConstraintSetId, CompiledConstraintBlock, ConstraintError};

// --- Public Interface Definitions ---

/// Protocol for compilation tasks sent to the service.
pub enum CompilationTask {
    /// Request to compile a constraint set definition.
    CompileDefinition { 
        set_id: ConstraintSetId, 
        // Renamed for clarity: suggests expected heavy input data
        noir_bytecode_or_acvm_ir: String, 
        gax_policies: String 
    },
    Shutdown,
}

/// Handle allowing external components (like the Scheduler) to interact with the running service.
pub struct CompilerServiceHandle {
    pub task_sender: mpsc::Sender<CompilationTask>,
}

// --- Internal Engine Implementation ---

/// The actual compilation service engine, hidden internally.
struct CompilerEngine {
    task_receiver: mpsc::Receiver<CompilationTask>,
    result_sender: mpsc::Sender<(ConstraintSetId, Result<CompiledConstraintBlock, ConstraintError>)>,
}

impl CompilerServiceHandle {
    /// Initializes and spawns the Async Constraint Compiler service.
    /// 
    /// Returns the handle used to send compilation tasks.
    pub fn spawn_service(
        task_buffer_size: usize,
        result_sender: mpsc::Sender<(ConstraintSetId, Result<CompiledConstraintBlock, ConstraintError>)>,
    ) -> CompilerServiceHandle {
        let (task_sender, task_receiver) = mpsc::channel(task_buffer_size);

        let engine = CompilerEngine {
            task_receiver,
            result_sender,
        };

        // Spawn the background runtime for the compiler
        tokio::task::spawn(engine.run());
        
        info!("Async Constraint Compiler service spawned successfully with buffer size: {}", task_buffer_size);

        CompilerServiceHandle {
            task_sender,
        }
    }
}

impl CompilerEngine {
    /// Main event loop for handling compilation tasks asynchronously.
    #[instrument(skip(self), name = "CompilerEngine")]
    pub async fn run(mut self) {
        info!("Async Constraint Compiler operational and awaiting tasks...");
        
        while let Some(task) = self.task_receiver.recv().await {
            match task {
                CompilationTask::CompileDefinition { 
                    set_id, 
                    noir_bytecode_or_acvm_ir, 
                    gax_policies 
                } => {
                    let start_time = Instant::now();
                    info!(
                        set_id = %set_id,
                        bytecode_len = noir_bytecode_or_acvm_ir.len(), 
                        "Receiving compilation task."
                    );

                    // Move heavy compilation work to a blocking thread
                    let compilation_result = tokio::task::spawn_blocking(move || {
                        
                        // This closure executes synchronously in a dedicated threadpool
                        if noir_bytecode_or_acvm_ir.is_empty() {
                            return Err(ConstraintError::CompilationFailed("Input definition missing or invalid.".to_string()));
                        }
                        
                        // Simulated successful compilation
                        Ok(CompiledConstraintBlock { 
                            compilation_version: 3, 
                            gax_ii_boundary_checks: vec![],
                            gax_iii_input_integrity: vec![],
                        })
                    }).await.unwrap_or_else(|e| {
                        // Handles panics from the blocking thread
                        error!(set_id = %set_id, "Compiler blocking thread panicked.");
                        Err(ConstraintError::ExternalDependencyFailure(format!("Compiler thread panicked: {}", e)))
                    });

                    let duration = start_time.elapsed();
                    match compilation_result {
                        Ok(_) => info!(set_id = %set_id, duration_ms = duration.as_millis(), "Compilation successful."),
                        Err(ref e) => error!(set_id = %set_id, duration_ms = duration.as_millis(), error = %e, "Compilation failed."),
                    }
                    
                    // Send result back. If the result channel is closed, we must assume the scheduler shut down.
                    if let Err(e) = self.result_sender.send((set_id, compilation_result)).await {
                        info!("Failed to send compilation result for set {}. Receiver dropped: {:?}", set_id, e.0);
                        // Terminate the compiler gracefully if results cannot be delivered
                        break;
                    }
                }
                CompilationTask::Shutdown => {
                    info!("Async Constraint Compiler shutting down gracefully upon request.");
                    break;
                }
            }
        }
        info!("Async Constraint Compiler loop terminated.");
    }
}