/**
 * AGI-KERNEL v7.11.3 [SystemRollbackCoordinatorKernel]
 * Role: State Reversion & Damage Control Orchestrator.
 * Orchestrates necessary steps to revert system state to the last known
 * stable commit (LSC) or neutral boundary state upon critical integrity failure.
 */
class SystemRollbackCoordinatorKernel {
    /**
     * @private
     * @type {IIdempotencyGuardToolKernel}
     */
    idempotencyGuard;

    /**
     * @private
     * @type {ISystemStateManagerToolKernel}
     */
    stateManager;

    /**
     * @private
     * @type {ILoggerToolKernel}
     */
    logger;

    /**
     * @param {object} dependencies
     * @param {IIdempotencyGuardToolKernel} dependencies.idempotencyGuardToolKernel
     * @param {ISystemStateManagerToolKernel} dependencies.systemStateManagerToolKernel
     * @param {ILoggerToolKernel} dependencies.loggerToolKernel
     */
    constructor(dependencies) {
        this._dependencies = dependencies;
        this.#setupDependencies();
    }

    /**
     * Isolates and validates required dependencies.
     * @private
     */
    #setupDependencies() {
        const {
            idempotencyGuardToolKernel,
            systemStateManagerToolKernel,
            loggerToolKernel
        } = this._dependencies;

        if (!idempotencyGuardToolKernel || typeof idempotencyGuardToolKernel.acquire !== 'function') {
            throw new Error('Dependency missing or invalid: IIdempotencyGuardToolKernel.');
        }
        if (!systemStateManagerToolKernel || typeof systemStateManagerToolKernel.revertToLastStableState !== 'function') {
            throw new Error('Dependency missing or invalid: ISystemStateManagerToolKernel.');
        }
        if (!loggerToolKernel) {
             throw new Error('Dependency missing: ILoggerToolKernel.');
        }

        this.idempotencyGuard = idempotencyGuardToolKernel;
        this.stateManager = systemStateManagerToolKernel;
        this.logger = loggerToolKernel;
    }

    /**
     * Initializes the kernel (required asynchronous pattern).
     */
    async initialize() {
        this.logger.debug("SystemRollbackCoordinatorKernel initialized.");
    }

    /**
     * Initiates a mandatory rollback sequence based on a critical integrity failure.
     * This should be called immediately after a critical breach is detected.
     * @param {string} proposalId - The failed artifact ID.
     * @param {object} failureContext - Details surrounding the integrity breach and impacted resources.
     * @returns {Promise<boolean>} True if rollback was successfully initiated or completed.
     */
    async initiateRollback(proposalId, failureContext) {
        // Use the IIdempotencyGuardToolKernel to ensure only one rollback runs concurrently for this proposalId
        if (!this.idempotencyGuard.acquire(proposalId)) {
            this.logger.warn(`Rollback already in progress for ${proposalId}. Skipping initiation.`);
            return true;
        }

        // Log the full failure context immediately upon critical initiation.
        const contextStr = JSON.stringify(failureContext || {}, null, 2);
        this.logger.critical(`[ROLLBACK REQUIRED] Initiating state reversion due to integrity failure: ${proposalId}. Failure Context:\n${contextStr}`);

        try {
            // 1. Analyze the scope of changes introduced by the failed proposal
            const scope = await this.stateManager.analyzeImpact(proposalId, failureContext);
            
            // 2. Execute reversion sequence (e.g., revert DB transactions, restore configurations)
            const success = await this.stateManager.revertToLastStableState(scope);

            if (success) {
                this.logger.info(`Rollback complete for ${proposalId}. System returned to a known stable state.`);
                return true;
            } else {
                // Enhanced logging to include the scope that failed to revert, aiding diagnosis.
                this.logger.error(`Partial or failed rollback for ${proposalId}. Escalation required. Analyzed scope: ${JSON.stringify(scope)}`);
                return false;
            }

        } catch (error) {
            this.logger.fatal(`Unrecoverable error during rollback coordination for ${proposalId}: ${error.message}`, { error: error.stack });
            return false;
        } finally {
            // Release the lock regardless of outcome
            this.idempotencyGuard.release(proposalId);
        }
    }
}

module.exports = SystemRollbackCoordinatorKernel;