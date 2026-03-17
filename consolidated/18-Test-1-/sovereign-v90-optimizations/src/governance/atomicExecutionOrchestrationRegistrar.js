import { ILoggerToolKernel } from './interfaces/ILoggerToolKernel';
import { IConceptualPolicyEvaluatorKernel } from './interfaces/IConceptualPolicyEvaluatorKernel';
import { RollbackToolInterfaces } from '../rollback/RollbackToolInterfaces'; // Assuming path adjustment

/**
 * AEOR: Atomic Execution & Orchestration Kernel (AIA Enforcement Layer v94.1)
 * Enforces AIA post-P-01 PASS governance by managing atomic state transitions 
 * (Mutation Commitment lock, Isolated execution, Audit Metric analysis) and triggering attested rollback 
 * guarantees upon failure threshold breach.
 */
class AtomicExecutionOrchestrationKernel {

    // Status definitions are internal constants for the kernel's outcomes.
    static AEOR_STATUS = {
        SUCCESS_COMMITTED: 'SUCCESS_COMMITTED',
        ROLLBACK_MANDATED: 'ROLLBACK_MANDATED',
        C04_ROLLBACK_FORCED: 'C04_ROLLBACK_FORCED',
        MCR_STATE_ERROR: 'MCR_STATE_ERROR',
        REGISTRATION_FAILURE: 'REGISTRATION_FAILURE',
        INTEGRITY_VIOLATION: 'INTEGRITY_VIOLATION'
    };

    /** @type {IMutationCommitmentToolKernel} */
    #mutationCommitmentTool;

    /** @type {IIsolatedExecutionSandboxToolKernel} */
    #isolatedSandboxTool;

    /** @type {IAuditMetricAnalysisToolKernel} */
    #auditMetricAnalysisTool;

    /** @type {IConceptualPolicyEvaluatorKernel} */
    #policyEvaluator;

    /** @type {ILoggerToolKernel} */
    #logger;

    /** @type {RollbackToolInterfaces.IRollbackCoordinatorToolKernel} */
    #rollbackCoordinator;

    /**
     * @param {object} dependencies - Injected high-integrity tools.
     * @param {IMutationCommitmentToolKernel} dependencies.mutationCommitmentTool
     * @param {IIsolatedExecutionSandboxToolKernel} dependencies.isolatedSandboxTool
     * @param {IAuditMetricAnalysisToolKernel} dependencies.auditMetricAnalysisTool
     * @param {IConceptualPolicyEvaluatorKernel} dependencies.policyEvaluator
     * @param {ILoggerToolKernel} dependencies.logger
     * @param {RollbackToolInterfaces.IRollbackCoordinatorToolKernel} dependencies.rollbackCoordinator
     */
    constructor(dependencies) {
        this.Status = AtomicExecutionOrchestrationKernel.AEOR_STATUS;
        this.#setupDependencies(dependencies);
    }

    /**
     * Synchronously resolves and validates required dependencies.
     */
    #setupDependencies(dependencies) {
        const { 
            mutationCommitmentTool, 
            isolatedSandboxTool, 
            auditMetricAnalysisTool, 
            policyEvaluator, 
            logger, 
            rollbackCoordinator 
        } = dependencies;

        if (!mutationCommitmentTool || !isolatedSandboxTool || !policyEvaluator || !logger || !rollbackCoordinator) {
            throw new Error("AtomicExecutionOrchestrationKernel requires all core operational tools: commitment, sandbox, policy, logger, and rollback coordinator.");
        }

        this.#mutationCommitmentTool = mutationCommitmentTool;
        this.#isolatedSandboxTool = isolatedSandboxTool;
        this.#auditMetricAnalysisTool = auditMetricAnalysisTool; 
        this.#policyEvaluator = policyEvaluator;
        this.#logger = logger;
        this.#rollbackCoordinator = rollbackCoordinator;
    }
    
    /**
     * Initializes the kernel asynchronously.
     * @returns {Promise<void>}
     */
    async initialize() {
        this.#logger.info("AtomicExecutionOrchestrationKernel operational.");
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
            const lockResult = await this.#mutationCommitmentTool.lockState(preMutationStateHash, payloadID);
            
            if (!lockResult || lockResult.success !== true) {
                this.#logger.error(`MCR state lock failed during registration for ${payloadID}.`, { lockResult });
                return { success: false, status: this.Status.MCR_STATE_ERROR };
            }

            this.#logger.info(`AEOR: Lock acquired for ${payloadID}. State HASH: ${preMutationStateHash.substring(0, 8)}`);
            
            // 4.2: Prepare C-04 for execution staging
            await this.#isolatedSandboxTool.stageDeployment(payloadID);

            return { success: true, status: this.Status.SUCCESS_COMMITTED };
        } catch (error) {
            this.#logger.error(`AEOR Registration failure for ${payloadID}. Attempting cleanup if necessary.`, { error: error.message, payloadID });
            return { success: false, status: this.Status.REGISTRATION_FAILURE, details: { error: error.message } };
        }
    }

    /** Helper: Executes the payload within the isolated sandbox environment. */
    async _coordinateIsolationExecution(deploymentID) {
        this.#logger.debug(`Starting C-04 execution for ${deploymentID}.`);
        try {
            const result = await this.#isolatedSandboxTool.execute(deploymentID);

            if (!result || result.success !== true) {
                const reason = result?.reason || 'Isolation Failure: Sandbox internal veto or incomplete result.';
                await this._handleForcedRollback(deploymentID, reason);
                return { success: false, status: this.Status.C04_ROLLBACK_FORCED };
            }
            return { success: true, executionResult: result };

        } catch (error) {
            // External execution hard crash
            this.#logger.critical(`AEOR FATAL error during isolated execution for ${deploymentID}.`, { error: error.message });
            await this._handleForcedRollback(deploymentID, 'Fatal Execution Error: Infrastructure crash.');
            return { success: false, status: this.Status.C04_ROLLBACK_FORCED };
        }
    }

    /** Helper: Retrieves metrics, runs audit, and performs policy check. */
    async _enforcePostExecutionAudit(deploymentID) {
        this.#logger.debug(`AEOR: Starting concurrent post-execution audit for ${deploymentID}.`);

        // Concurrently retrieve potentially heavy metrics/analysis data
        const [metrics, debtAnalysis] = await Promise.all([
            this.#auditMetricAnalysisTool.getMetrics(deploymentID), 
            this.#auditMetricAnalysisTool.analyze(deploymentID)      
        ]);

        const evaluationContext = { deploymentID, metrics, debtAnalysis };

        // Evaluate against Governance Rule Source (C-15 logic via Policy Evaluator)
        const policyResult = await this.#policyEvaluator.evaluatePolicy(
            'ATOMIC_EXECUTION_VETO', 
            evaluationContext
        );
        
        if (policyResult && policyResult.veto === true) {
            const reason = policyResult.reason || 'Defined policy threshold breached';
            this.#logger.warn(`AEOR Audit Veto triggered for ${deploymentID}. Reason: ${reason}`);
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
        const commitStatus = await this.#mutationCommitmentTool.commitAndRelease(deploymentID);
        
        if (!commitStatus || commitStatus.success !== true) {
            // HIGH INTEGRITY FAILURE: MCR failed to transition state from locked to committed/released.
            this.#logger.fatal(`MCR INTEGRITY VIOLATION: Commit failed for ${deploymentID}. State status unknown.`, commitStatus);
            throw new Error(this.Status.INTEGRITY_VIOLATION); 
        }

        this.#logger.info(`AEOR: Mutation committed and lock released for ${deploymentID}.`, analysis);
    }

    /** 
     * Implements the attested atomic rollback guarantee using the dedicated rollback coordinator.
     */
    async triggerAtomicRollback(deploymentID, reason) {
        this.#logger.critical(`INITIATING ATTESTED ATOMIC ROLLBACK for ${deploymentID}. Reason: ${reason}`);
        
        try {
            const rollbackResult = await this.#rollbackCoordinator.executeRollback({
                deploymentID: deploymentID,
                reason: reason,
                scope: 'ATOMIC_TRANSITION_FAILURE',
                attestationRequired: true
            });

            if (!rollbackResult || rollbackResult.success !== true) {
                this.#logger.fatal(`CRITICAL FAILURE: Atomic rollback failed for ${deploymentID}.`, rollbackResult);
                throw new Error("Rollback execution failed.");
            }

            this.#logger.info(`Rollback complete and attested for ${deploymentID}.`);

        } catch (error) {
            this.#logger.fatal(`FATAL ROLLBACK ERROR for ${deploymentID}. System integrity compromised.`, { error: error.message });
            throw error;
        }
    }

    /** Helper: Handles the forced rollback path. */
    async _handleForcedRollback(deploymentID, reason) {
        this.#logger.critical(`FORCED ROLLBACK initiated for ${deploymentID}. Reason: ${reason}`);
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

        try {
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
            
            // 5.3: Commit and Release Lock
            await this._coordinateCommit(deploymentID, auditResult.analysis);
            
            return { status: this.Status.SUCCESS_COMMITTED, analysis: auditResult.analysis };

        } catch (e) {
            this.#logger.fatal(`Catastrophic AEOR failure during commit/audit chain for ${deploymentID}.`, { error: e.message, status: e.message === this.Status.INTEGRITY_VIOLATION ? this.Status.INTEGRITY_VIOLATION : 'UNKNOWN_FATAL_ERROR' });
            
            // If the failure was not due to MCR integrity violation, attempt one final rollback.
            if (e.message !== this.Status.INTEGRITY_VIOLATION) {
                 // Rollback failure is handled inside _handleForcedRollback
                 await this._handleForcedRollback(deploymentID, `Internal orchestration crash: ${e.message}`);
            }
            
            return { status: this.Status.INTEGRITY_VIOLATION, details: { error: e.message } };
        }
    }
}