/**
 * Role: Post-Execution Integrity and Quarantine Enforcement (PEIQ) Kernel.
 * Strictly monitors post-execution risk and enforces mandatory auditing and artifact quarantine
 * upon breach detection, adhering to AIA non-blocking execution mandates.
 */
class IntegrityQuarantineKernel {
    
    // Standardized constants (derived from conceptual definitions, often fetched from a registry)
    static CONFIG_KEY = 'INTEGRITY_QUARANTINE_POLICY';
    
    // Standardized risk and status keys for cross-component consistency
    static RISK_KEYS = Object.freeze({
        SCORE: 'aggregateRisk',
        THRESHOLD: 'failureThreshold',
        STATUS: {
            BREACH: 'INTEGRITY_BREACH',
            QUARANTINED: 'QUARANTINED_FAILURE'
        }
    });

    /**
     * @param {ILoggerToolKernel} logger 
     * @param {IConfigurationDefaultsRegistryKernel} configRegistry 
     * @param {IMultiTargetAuditDisperserToolKernel} auditDisperser
     * @param {IArtifactArchiverToolKernel} artifactArchiver
     * @param {IIntegrityBreachDetectorToolKernel} breachDetector
     * @param {IFeedbackLoopAggregatorToolKernel} fba
     * @param {IConsensusErrorCodesRegistryKernel} errorRegistry
     */
    constructor(logger, configRegistry, auditDisperser, artifactArchiver, breachDetector, fba, errorRegistry) {
        // Dependency injection of specialized Tool Kernels
        this.logger = logger;
        this.configRegistry = configRegistry;
        this.auditDisperser = auditDisperser;
        this.artifactArchiver = artifactArchiver;
        this.breachDetector = breachDetector;
        this.fba = fba;
        this.errorRegistry = errorRegistry;
        
        this.config = null; // Loaded asynchronously
    }

    /**
     * Loads configuration asynchronously and initializes the kernel state.
     * @async
     */
    async initialize() {
        this.config = await this.configRegistry.get(IntegrityQuarantineKernel.CONFIG_KEY);
        
        if (!this.config || typeof this.config.failureThreshold !== 'number' || typeof this.config.quarantinePath !== 'string') {
            const conceptId = await this.errorRegistry.getConceptId('GOV_E_005'); // Configuration Error
            // Throwing after fetching standardized error code
            throw new Error(`[IntegrityQuarantineKernel] Invalid or missing configuration for key ${IntegrityQuarantineKernel.CONFIG_KEY}. Concept ID: ${conceptId}`);
        }
        
        await this.logger.info('IntegrityQuarantineKernel initialized successfully.', { configKey: IntegrityQuarantineKernel.CONFIG_KEY });
    }

    /**
     * Generates a high-priority runtime notification using the auditable Logger Kernel.
     * @private
     * @async
     * @param {string} proposalId
     * @param {number} risk
     */
    async _notifyBreach(proposalId, risk) {
        const threshold = this.config.failureThreshold;
        await this.logger.warn(
            `Proposal ID ${proposalId} triggered mandatory quarantine. Risk (${risk.toFixed(4)}) exceeded threshold (${threshold.toFixed(4)}).`, 
            {
                proposalId,
                concept: IntegrityQuarantineKernel.RISK_KEYS.STATUS.BREACH,
                riskScore: risk,
                threshold
            }
        );
    }

    /**
     * @async
     * Evaluates metrics post-C-04 execution and enforces quarantine if integrity is compromised.
     * @param {string} proposalId - The ID of the currently executed architectural payload (A-01 artifact).
     * @param {object} executionMetrics - Data provided by FBA on stability/performance/risk vectors.
     * @returns {Promise<boolean>} True if post-execution integrity holds, false if quarantine is triggered.
     */
    async monitor(proposalId, executionMetrics) {
        if (!this.config) {
             throw new Error("IntegrityQuarantineKernel not initialized. Call initialize() first.");
        }
        
        // 1. Calculate aggregated failure risk using the formalized FBA Tool Kernel
        const aggregateRisk = await this.fba.calculatePostExecutionRisk(executionMetrics);

        // 2. Determine breach status and generate structured audit payload
        const decision = await this.breachDetector.executeAsync({
            proposalId,
            riskScore: aggregateRisk,
            failureThreshold: this.config.failureThreshold,
            executionMetrics
        });

        if (decision.isBreach) {
            
            await this._notifyBreach(proposalId, aggregateRisk);
            
            // 3. Trigger mandatory structured audit log via the dispersal kernel
            await this.auditDisperser.disperseAuditRecord(decision.auditPayload); 

            // 4. Move the failed payload (A-01 artifact) to quarantine
            await this._enforceQuarantine(proposalId);

            // 5. Signal failure
            return false;
        }

        // 6. Log successful integrity check
        await this.logger.debug(`Proposal ${proposalId} passed integrity check. Risk: ${aggregateRisk.toFixed(4)}`, { proposalId, risk: aggregateRisk });
        return true;
    }

    /**
     * Archives the failed artifact payload using the dedicated Archiver Tool Kernel.
     * @private
     * @async
     * @param {string} proposalId 
     * @returns {Promise<void>}
     */
    async _enforceQuarantine(proposalId) {
        const quarantinePath = this.config.quarantinePath;
        try {
            await this.artifactArchiver.archiveArtifact(proposalId, quarantinePath);
            await this.logger.info(`Payload ${proposalId} secured in quarantine.`, { 
                proposalId, 
                status: IntegrityQuarantineKernel.RISK_KEYS.STATUS.QUARANTINED,
                path: quarantinePath
            });
        } catch (error) {
            // CRITICAL: Use structured logging for auditability
            await this.logger.critical(`CRITICAL ARCHIVE FAILURE: Failed to move proposal ${proposalId} to quarantine.`, { 
                proposalId, 
                error: error.message 
            });
            // AIA mandate: do not re-throw if the goal is strictly logging and non-blocking continuation.
        }
    }
}

module.exports = IntegrityQuarantineKernel;