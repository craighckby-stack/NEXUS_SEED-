// AEOR: Atomic Execution & Orchestration Registrar (AIA Enforcement Layer v94.1)

/**
 * AEOR: Atomic Execution & Orchestration Registrar (AIA Enforcement Layer v94.1)
 * Maximally efficient orchestration layer. Enforces AIA governance via recursive 
 * state transition management (MCR lock, C-04 isolated execution, concurrent audit) 
 * and guaranteed atomic rollback upon failure threshold breach.
 */
class AtomicExecutionOrchestrationRegistrar {

    // Status definitions utilize fixed memory references for maximum lookup efficiency.
    static AEOR_STATUS = {
        SUCCESS_COMMITTED: 'SUCCESS_COMMITTED',
        ROLLBACK_MANDATED: 'ROLLBACK_MANDATED',
        C04_ROLLBACK_FORCED: 'C04_ROLLBACK_FORCED',
        MCR_STATE_ERROR: 'MCR_STATE_ERROR',
        REGISTRATION_FAILURE: 'REGISTRATION_FAILURE',
        INTEGRITY_VIOLATION: 'INTEGRITY_VIOLATION'
    };

    /**
     * @param {object} dependencies - Structured dependencies injection.
     * @param {MCR} dependencies.mcr
     * @param {C04} dependencies.c04
     * @param {FBA} dependencies.fba
     * @param {SEA} dependencies.sea
     * @param {PolicyEngine} dependencies.policyEngine
     * @param {TelemetryService} dependencies.telemetry
     */
    constructor({ mcr, c04, fba, sea, policyEngine, telemetry }) {
        if (!mcr || !c04 || !policyEngine || !telemetry) {
            throw new Error("AEOR requires MCR, C04, PolicyEngine, and Telemetry dependencies.");
        }

        // Assign references once for fast access
        this.MCR = mcr;        
        this.C04 = c04;        
        this.FBA = fba;        
        this.SEA = sea;        
        this.PolicyEngine = policyEngine;
        this.Telemetry = telemetry;
        this.Status = AtomicExecutionOrchestrationRegistrar.AEOR_STATUS;
    }

    /** 
     * Stage 4: Registers Commitment and acquires state lock atomically.
     * @param {string} payloadID - Identifier for the mutation event.
     * @param {string} preMutationStateHash - Cryptographic hash of the current state.
     * @returns {Promise<{success: boolean, status: string, details?: object}>}
     */
    async registerCommitment(payloadID, preMutationStateHash) {
        const S = this.Status; // Local reference for efficiency

        if (!payloadID || !preMutationStateHash) {
            return { success: false, status: S.REGISTRATION_FAILURE, details: { reason: "Missing identifiers." } };
        }

        try {
            // 4.1: Attempt MCR Lock
            const lockResult = await this.MCR.lockState(preMutationStateHash, payloadID);
            
            if (!lockResult || lockResult.success !== true) {
                this.Telemetry.error(`MCR state lock failed for ${payloadID}.`, { lockResult });
                return { success: false, status: S.MCR_STATE_ERROR };
            }

            this.Telemetry.debug(`AEOR Lock acquired: ${payloadID}.`);
            
            // 4.2: Prepare C-04 for execution staging (non-blocking setup)
            await this.C04.stageDeployment(payloadID);

            return { success: true, status: S.SUCCESS_COMMITTED };
        } catch (error) {
            this.Telemetry.error(`AEOR Registration failure for ${payloadID}.`, { error: error.message });
            return { success: false, status: S.REGISTRATION_FAILURE, details: { error: error.message } };
        }
    }

    /** Helper: Executes the payload within the isolated C-04 environment. */
    async _coordinateIsolationExecution(deploymentID) {
        const S = this.Status;

        try {
            const result = await this.C04.execute(deploymentID);

            if (!result || result.success !== true) {
                const reason = result?.reason || 'C-04 Isolation Failure.';
                // Recursive abstraction: Failure triggers immediate atomic rollback guarantee
                await this._triggerGuaranteedRollback(deploymentID, reason);
                return { success: false, status: S.C04_ROLLBACK_FORCED };
            }
            return { success: true, executionResult: result };

        } catch (error) {
            // Infrastructure hard crash: Immediately initiate rollback
            this.Telemetry.critical(`AEOR FATAL error during C-04 execution for ${deploymentID}.`, { error: error.message });
            await this._triggerGuaranteedRollback(deploymentID, 'Fatal Execution Error: Infrastructure crash.');
            return { success: false, status: S.C04_ROLLBACK_FORCED };
        }
    }

    /** 
     * Helper: Performs concurrent FBA/SEA audit and policy evaluation.
     * Maximizes computational efficiency using Promise.all.
     */
    async _enforcePostExecutionAudit(deploymentID) {
        // Concurrently retrieve heavy analysis data (I/O parallelization)
        const [metrics, debtAnalysis] = await Promise.all([
            this.FBA.getMetrics(deploymentID),
            this.SEA.analyze(deploymentID)
        ]);

        const evaluationContext = { deploymentID, metrics, debtAnalysis };

        // Evaluate against Governance Rule Source (low latency local check)
        const vetoCheck = this.PolicyEngine.checkRollbackVeto(evaluationContext);
        
        if (vetoCheck && vetoCheck.veto === true) {
            const reason = vetoCheck.reason || 'Defined policy threshold breached';
            this.Telemetry.warn(`AEOR Audit Veto triggered for ${deploymentID}. Reason: ${reason}`);
            return { 
                mandatedRollback: true, 
                reason: reason,
                analysis: evaluationContext
            };
        }

        return { mandatedRollback: false, analysis: evaluationContext };
    }
    
    /** Helper: Commits the mutation and releases the MCR state lock. */
    async _coordinateCommit(deploymentID, analysis) {
        const S = this.Status;
        // Enforce atomic completion registration
        const commitStatus = await this.MCR.commitAndRelease(deploymentID);
        
        if (!commitStatus || commitStatus.success !== true) {
            // HIGH INTEGRITY FAILURE: State transition failed.
            this.Telemetry.fatal(`MCR INTEGRITY VIOLATION: Commit failed for ${deploymentID}.`, commitStatus);
            // Throwing signals catastrophic failure to the supervisor
            throw new Error(S.INTEGRITY_VIOLATION);
        }

        this.Telemetry.info(`AEOR: Committed and lock released for ${deploymentID}.`);
    }

    /** Helper: Handles the forced/mandated rollback path. Abstraction of atomic guarantee. */
    async _triggerGuaranteedRollback(deploymentID, reason) {
        this.Telemetry.critical(`GUARANTEED ATOMIC ROLLBACK initiated for ${deploymentID}. Reason: ${reason}`);
        // The complexity of rollback is abstracted to triggerAtomicRollback.
        await this.triggerAtomicRollback(deploymentID, reason);
    }


    /** 
     * Stage 5: Core orchestration pipeline. Supervises execution, audit, and commit.
     * @param {string} deploymentID 
     * @returns {Promise<{status: string, analysis?: object, details?: object}>}
     */
    async superviseExecutionAndAudit(deploymentID) {
        const S = this.Status;

        if (!deploymentID) {
            return { status: S.REGISTRATION_FAILURE, details: { reason: "Missing deployment ID." } };
        }

        // 5.1: Isolation Execution (Recursively handles C04 forced rollback internally)
        const executionFlow = await this._coordinateIsolationExecution(deploymentID);
        if (!executionFlow.success) {
            return { status: executionFlow.status };
        }
        
        // 5.2: Concurrent Post-Execution Audit
        const auditResult = await this._enforcePostExecutionAudit(deploymentID);

        if (auditResult.mandatedRollback) {
            // 5.3a: Policy Mandated Rollback (Recursive guarantee)
            await this._triggerGuaranteedRollback(deploymentID, auditResult.reason);
            return { status: S.ROLLBACK_MANDATED, analysis: auditResult.analysis };
        }

        try {
            // 5.3b: Commitment and Release
            await this._coordinateCommit(deploymentID, auditResult.analysis);
            return { status: S.SUCCESS_COMMITTED, analysis: auditResult.analysis };

        } catch (e) {
             // Catches INTEGRITY_VIOLATION explicitly thrown by _coordinateCommit
             return { status: S.INTEGRITY_VIOLATION, details: { error: e.message } };
        }
    }

    /** 
     * Initiates the auditable, irreversible atomic rollback sequence (MCR reverse + C04 cleanup).
     * @returns {Promise<{success: boolean, reason?: string}>}
     */
    async triggerAtomicRollback(deploymentID, reason) {
        const S = this.Status;

        let mcrSuccess = false;
        let c04Success = false;

        try {
            // 1. Revert state and release lock (MCR CRITICAL STEP)
            const mcrResult = await this.MCR.reverseAndRelease(deploymentID, reason);
            mcrSuccess = mcrResult && mcrResult.success;
            
            // 2. Instruct C-04 to discard changes (C04 CLEANUP STEP)
            const c04Result = await this.C04.rollback(deploymentID); 
            c04Success = c04Result && c04Result.success;

            // Logging minimal critical errors if partial failure occurs
            if (!mcrSuccess) {
                 this.Telemetry.error(`Rollback Failure Step 1 (MCR): Failed state reversal for ${deploymentID}.`);
            }
            if (!c04Success) {
                 this.Telemetry.error(`Rollback Failure Step 2 (C-04): Environment cleanup failed for ${deploymentID}.`);
            }

            if (!mcrSuccess || !c04Success) {
                 // If either step failed, flag a partial rollback risk.
                 throw new Error("Partial Rollback Failure Detected."); 
            }

            this.Telemetry.info(`Rollback complete for ${deploymentID}. State integrity restored.`);
            return { success: true };

        } catch (rollbackError) {
             // Catastrophic AEOR Failsafe Breach
             this.Telemetry.fatal(`CATASTROPHIC AEOR FAILURE: Rollback sequence integrity breach for ${deploymentID}.`, 
                                 { error: rollbackError.message, mcrSuccess, c04Success });
             return { success: false, reason: S.INTEGRITY_VIOLATION };
        }
    }
}