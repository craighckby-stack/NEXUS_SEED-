// AEOR: Atomic Execution & Orchestration Registrar (AIA Enforcement Layer v94.1)

/**
 * AEOR: Atomic Execution & Orchestration Registrar (AIA Enforcement Layer v94.1)
 * Enforces AIA post-P-01 PASS governance by managing atomic state transitions 
 * (MCR lock, C-04 isolated execution, FBA/SEA audit) and triggering attested rollback 
 * guarantees upon failure threshold breach.
 */
class AtomicExecutionOrchestrationRegistrar {

    // Status definitions are internal constants for the registrar's outcomes.
    static AEOR_STATUS = {
        SUCCESS_COMMITTED: 'SUCCESS_COMMITTED',
        ROLLBACK_MANDATED: 'ROLLBACK_MANDATED',
        C04_ROLLBACK_FORCED: 'C04_ROLLBACK_FORCED',
        MCR_STATE_ERROR: 'MCR_STATE_ERROR',
        REGISTRATION_FAILURE: 'REGISTRATION_FAILURE',
        INTEGRITY_VIOLATION: 'INTEGRITY_VIOLATION' // Added for catastrophic failures during commit/rollback
    };

    /**
     * @param {object} dependencies - Structured dependencies injection.
     * @param {MCR} dependencies.mcr - Mutation Commitment Registrar
     * @param {C04} dependencies.c04 - Autogeny Sandbox
     * @param {FBA} dependencies.fba - Feedback Aggregator
     * @param {SEA} dependencies.sea - Systemic Entropy Auditor
     * @param {PolicyEngine} dependencies.policyEngine - Governance rule evaluation
     * @param {TelemetryService} dependencies.telemetry - Auditable logging service
     */
    constructor({ mcr, c04, fba, sea, policyEngine, telemetry }) {
        if (!mcr || !c04 || !policyEngine || !telemetry) {
            throw new Error("AEOR requires MCR, C04, PolicyEngine, and Telemetry dependencies.");
        }

        this.MCR = mcr;        
        this.C04 = c04;        
        this.FBA = fba;        
        this.SEA = sea;        
        this.PolicyEngine = policyEngine;
        this.Telemetry = telemetry;
        this.Status = AtomicExecutionOrchestrationRegistrar.AEOR_STATUS;
    }

    /** 
     * Stage 4: Registers Commitment and acquires state lock. 
     * @param {string} payloadID - Identifier for the mutation event.
     * @param {string} preMutationStateHash - Cryptographic hash of the current state.
     * @returns {Promise<{success: boolean, status: string, details?: object}>}
     */
    async registerCommitment(payloadID, preMutationStateHash) {
        if (!payloadID || !preMutationStateHash) {
            return { success: false, status: this.Status.REGISTRATION_FAILURE, details: { reason: "Missing required identifiers." } };
        }

        try {
            // 4.1: Log state hash and acquire exclusive lock
            const lockResult = await this.MCR.lockState(preMutationStateHash, payloadID);
            
            if (!lockResult || lockResult.success !== true) {
                this.Telemetry.error(`MCR state lock failed during registration for ${payloadID}.`, { lockResult });
                return { success: false, status: this.Status.MCR_STATE_ERROR };
            }

            this.Telemetry.info(`AEOR: Lock acquired for ${payloadID}. State HASH: ${preMutationStateHash.substring(0, 8)}`);
            
            // 4.2: Prepare C-04 for execution staging
            await this.C04.stageDeployment(payloadID);

            return { success: true, status: this.Status.SUCCESS_COMMITTED };
        } catch (error) {
            this.Telemetry.error(`AEOR Registration failure for ${payloadID}. Attempting cleanup if necessary.`, { error: error.message, payloadID });
            return { success: false, status: this.Status.REGISTRATION_FAILURE, details: { error: error.message } };
        }
    }

    /** Helper: Executes the payload within the isolated C-04 environment. */
    async _coordinateIsolationExecution(deploymentID) {
        this.Telemetry.debug(`Starting C-04 execution for ${deploymentID}.`);
        try {
            const result = await this.C04.execute(deploymentID);

            if (!result || result.success !== true) {
                const reason = result?.reason || 'C-04 Isolation Failure: Sandbox internal veto or incomplete result.';
                await this._handleForcedRollback(deploymentID, reason);
                return { success: false, status: this.Status.C04_ROLLBACK_FORCED };
            }
            return { success: true, executionResult: result };

        } catch (error) {
            // External execution hard crash
            this.Telemetry.critical(`AEOR FATAL error during C-04 execution for ${deploymentID}.`, { error: error.message });
            await this._handleForcedRollback(deploymentID, 'Fatal Execution Error: Infrastructure crash.');
            return { success: false, status: this.Status.C04_ROLLBACK_FORCED };
        }
    }

    /** Helper: Retrieves metrics, runs SEA/FBA audits, and performs policy check. */
    async _enforcePostExecutionAudit(deploymentID) {
        this.Telemetry.debug(`AEOR: Starting concurrent post-execution audit for ${deploymentID}.`);

        // Concurrently retrieve potentially heavy metrics/analysis data
        const [metrics, debtAnalysis] = await Promise.all([
            this.FBA.getMetrics(deploymentID),
            this.SEA.analyze(deploymentID)
        ]);

        const evaluationContext = { deploymentID, metrics, debtAnalysis };

        // Evaluate against Governance Rule Source (C-15 logic via Policy Engine)
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
        // Enforce atomic completion registration
        const commitStatus = await this.MCR.commitAndRelease(deploymentID);
        
        if (!commitStatus || commitStatus.success !== true) {
            // HIGH INTEGRITY FAILURE: MCR failed to transition state from locked to committed/released.
            this.Telemetry.fatal(`MCR INTEGRITY VIOLATION: Commit failed for ${deploymentID}. State status unknown.`, commitStatus);
            throw new Error(this.Status.INTEGRITY_VIOLATION); 
        }

        this.Telemetry.info(`AEOR: Mutation committed and lock released for ${deploymentID}.`, analysis);
    }

    /** Helper: Handles the forced rollback path. */
    async _handleForcedRollback(deploymentID, reason) {
        this.Telemetry.critical(`FORCED ROLLBACK initiated for ${deploymentID}. Reason: ${reason}`);
        // Note: Errors during forced rollback are handled internally by triggerAtomicRollback.
        await this.triggerAtomicRollback(deploymentID, reason);
    }


    /** 
     * Stage 5: Supervises execution and evaluates necessity of atomic rollback. 
     * This is the core orchestration function.
     * @param {string} deploymentID 
     * @returns {Promise<{status: string, analysis?: object, details?: object}>}
     */
    async superviseExecutionAndAudit(deploymentID) {
        if (!deploymentID) {
            return { status: this.Status.REGISTRATION_FAILURE, details: { reason: "Missing deployment ID for supervision." } };
        }

        // 5.1: Isolation Execution
        const executionFlow = await this._coordinateIsolationExecution(deploymentID);
        if (!executionFlow.success) {
            return { status: executionFlow.status };
        }
        
        // 5.2: Post-Execution Audit
        const auditResult = await this._enforcePostExecutionAudit(deploymentID);

        if (auditResult.mandatedRollback) {
            await this.triggerAtomicRollback(deploymentID, auditResult.reason);
            return { status: this.Status.ROLLBACK_MANDATED, analysis: auditResult.analysis };
        }

        try {
            // 5.3: Commitment and Release
            await this._coordinateCommit(deploymentID, auditResult.analysis);
            return { status: this.Status.SUCCESS_COMMITTED, analysis: auditResult.analysis };

        } catch (e) {
             // Catches INTEGRITY_VIOLATION thrown by _coordinateCommit
             if (e.message === this.Status.INTEGRITY_VIOLATION) {
                 return { status: this.Status.INTEGRITY_VIOLATION, details: { error: "MCR Commit Failure led to state ambiguity." } };
             }
             // Re-throw other unexpected errors
             throw e;
        }
    }

    /** 
     * Initiates the auditable, irreversible atomic rollback sequence. 
     * This method must be highly resilient.
     * @returns {Promise<{success: boolean, reason?: string}>}
     */
    async triggerAtomicRollback(deploymentID, reason) {
        this.Telemetry.warn(`AIA ROLLBACK sequence started for ${deploymentID}. Reason: ${reason}`);
        
        let mcrSuccess = false;
        let c04Success = false;

        try {
            // 1. Revert state and release lock within MCR (CRITICAL STEP)
            const mcrResult = await this.MCR.reverseAndRelease(deploymentID, reason);
            mcrSuccess = mcrResult && mcrResult.success;
            if (!mcrSuccess) {
                 this.Telemetry.error(`Rollback Failure Step 1 (MCR): Failed to reverse/release state for ${deploymentID}.`, { reason, mcrResult });
            }
            
            // 2. Instruct C-04 to discard changes and clean environment (CLEANUP STEP)
            const c04Result = await this.C04.rollback(deploymentID); 
            c04Success = c04Result && c04Result.success;
            if (!c04Success) {
                 this.Telemetry.error(`Rollback Failure Step 2 (C-04): Environment cleanup failed for ${deploymentID}.`, { reason, c04Result });
            }

            if (!mcrSuccess || !c04Success) {
                 // If either step failed, flag a partial rollback risk.
                 throw new Error("Partial Rollback Failure Detected."); 
            }

            this.Telemetry.info(`Rollback complete for ${deploymentID}. State integrity restored.`);
            return { success: true };

        } catch (rollbackError) {
             // Catastrophic AEOR Failsafe Breach
             this.Telemetry.fatal(`CATASTROPHIC AEOR FAILURE: Rollback sequence integrity breach for ${deploymentID}. Immediate human intervention required.`, { error: rollbackError.message, mcrSuccess, c04Success });
             return { success: false, reason: this.Status.INTEGRITY_VIOLATION };
        }
    }
}