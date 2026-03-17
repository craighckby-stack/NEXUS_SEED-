/**
 * Component ID: HSI (Hashed State Indexer)
 * Mandate: Provide high-efficiency, read-only access to immutable D-01 and MCR records.
 * This kernel prevents direct querying of the primary state ledger, reducing latency
 * during time-critical consensus steps (like C-11 risk assessment and F-01 analysis).
 */

// Conceptual Constants for Auditable Reporting
const HSI_CONCEPT_ID = 'GOV_K_009';
const HSI_INIT_ERROR = 'GOV_E_010';

class EvolutionaryStateQueryKernel {
    
    /**
     * @param {Object} dependencies
     * @param {ILoggerToolKernel} dependencies.loggerToolKernel - Auditable logging utility.
     * @param {IHighEfficiencyStateRetrieverToolKernel} dependencies.stateRetrieverToolKernel - High-performance indexed retrieval tool (HESR).
     * @param {GovernanceAuditKernel} dependencies.governanceAuditKernel - Access tool for persistent D-01 audit records.
     * @param {Object} [dependencies.mcrAccessToolKernel] - Tool for accessing MCR (Mutation Chain Registrar) historical context.
     */
    constructor(dependencies) {
        this.dependencies = dependencies;
        this.initialized = false;
        this.#setupDependencies(dependencies);
    }

    #setupDependencies(dependencies) {
        const { loggerToolKernel, stateRetrieverToolKernel, governanceAuditKernel } = dependencies;

        // Enforce mandatory High-Integrity Dependencies
        if (!loggerToolKernel || !stateRetrieverToolKernel || !governanceAuditKernel) {
             throw new Error(`[${HSI_CONCEPT_ID}] Initialization failure: Missing mandatory kernel dependencies (Logger, StateRetriever, GovernanceAudit).`);
        }

        this.logger = loggerToolKernel;
        this.stateRetriever = stateRetrieverToolKernel;
        this.governanceAudit = governanceAuditKernel;
        this.mcrAccess = dependencies.mcrAccessToolKernel; // Optional/Conceptual dependency

        // Strict check for State Retriever Tool compliance
        if (typeof this.stateRetriever.retrieve !== 'function' || typeof this.stateRetriever.setFallbackRetriever !== 'function') {
             throw new Error(`[${HSI_CONCEPT_ID}] Dependency violation: stateRetrieverToolKernel does not conform to IHighEfficiencyStateRetrieverToolKernel interface.`);
        }
    }

    /**
     * Initializes the optimized index from existing D-01/MCR data and configures the retrieval pipeline.
     * @returns {Promise<boolean>}
     */
    async initialize() {
        if (this.initialized) {
            this.logger.warn({ conceptId: HSI_CONCEPT_ID, message: "Kernel already initialized." });
            return true;
        }

        try {
            this.logger.info({ conceptId: HSI_CONCEPT_ID, message: "HSI initializing: Configuring high-efficiency state retrieval (HESR)." });

            // Configure the persistent fallback mechanism using the Governance Audit Kernel (D-01 record retrieval).
            // Assumes GovernanceAuditKernel exposes an asynchronous retrieveRecordByHash method.
            const fallbackFn = this.governanceAudit.retrieveRecordByHash.bind(this.governanceAudit);
            await this.stateRetriever.setFallbackRetriever(fallbackFn);

            // NOTE: Placeholder for initial population logic from MCR/D01 historical data.
            // This would involve calling this.stateRetriever.populateIndex(data, 'hashKey');
            
            this.logger.info({ conceptId: HSI_CONCEPT_ID, message: "HSI successfully configured and ready for indexed queries." });
            this.initialized = true;
            return true;

        } catch (error) {
            // Mandatory structured error reporting via logger
            const normalizedError = {
                conceptId: HSI_INIT_ERROR,
                message: `Failed to initialize EvolutionaryStateQueryKernel. See details for root cause.`,
                details: { rootCause: error.message, component: HSI_CONCEPT_ID }
            };
            this.logger.error(normalizedError);
            // Delegate full error normalization to IErrorDetailNormalizationToolKernel upstream
            throw normalizedError;
        }
    }

    /**
     * Retrieves a full evolutionary state artifact by its cryptographic hash or index ID.
     * Optimized for O(1) lookup via the HESR tool, with asynchronous fallback to D-01 persistence.
     * @param {string} stateHashOrId
     * @returns {Promise<Object|null>}
     */
    async getStateByHash(stateHashOrId) {
        if (!this.initialized) {
            throw new Error(`[${HSI_CONCEPT_ID}] Operational VETO: Kernel not initialized.`);
        }
        // Delegate retrieval logic entirely to the high-efficiency tool, enforcing asynchronous flow
        return this.stateRetriever.retrieve(stateHashOrId);
    }

    /**
     * Provides the historical sequence required for C-11's contextual modeling.
     * Delegates to the MCR Access Tool Kernel.
     * @param {number} depth - How many prior steps to retrieve.
     * @returns {Promise<Array<Object>>}
     */
    async getHistoricalContext(depth) {
        if (!this.initialized) {
            throw new Error(`[${HSI_CONCEPT_ID}] Operational VETO: Kernel not initialized.`);
        }

        if (this.mcrAccess && typeof this.mcrAccess.getHistoricalSequence === 'function') {
             // Assuming mcrAccess provides the required method
             return this.mcrAccess.getHistoricalSequence(depth);
        }

        this.logger.warn({
            conceptId: HSI_CONCEPT_ID,
            message: "MCR Access Tool not fully integrated or lacks 'getHistoricalSequence'. Returning empty historical context."
        });
        return [];
    }
}

module.exports = EvolutionaryStateQueryKernel;