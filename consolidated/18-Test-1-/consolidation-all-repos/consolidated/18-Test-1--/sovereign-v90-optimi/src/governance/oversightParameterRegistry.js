/**
 * OVERSIGHT PARAMETER KERNEL (OPK)
 * Manages the canonical set of governance parameters tied to a specific system state hash.
 * Enforces non-blocking execution and delegates all I/O, integrity checks, and constraint
 * evaluation to specialized, asynchronous Tool Kernels, ensuring maximum recursive abstraction.
 */
class OversightParameterKernel {
    /**
     * @param {GovernanceSettingsRegistryKernel} configRegistry - Retrieves governance configurations.
     * @param {IHighEfficiencyStateRetrieverToolKernel} stateRetriever - Fetches immutable state payloads by hash.
     * @param {HashIntegrityCheckerToolKernel} integrityChecker - Ensures data integrity using cryptographic checks.
     * @param {IGovernanceConstraintEvaluatorToolKernel} constraintEvaluator - Handles GSEP and critical key constraints.
     * @param {IMutationChainPersistenceToolKernel} mutationPersister - Delegates mutation proposals.
     * @param {MultiTargetAuditDisperserToolKernel} auditLogger - Handles auditable logging.
     */
    constructor(configRegistry, stateRetriever, integrityChecker, constraintEvaluator, mutationPersister, auditLogger) {
        this.configRegistry = configRegistry;
        this.stateRetriever = stateRetriever;
        this.integrityChecker = integrityChecker;
        this.constraintEvaluator = constraintEvaluator;
        this.mutationPersister = mutationPersister;
        this.auditLogger = auditLogger;

        this.parameters = new Map();
        this.currentStateHash = null;
        this.criticalKeys = [];
        this.initialized = false;
    }

    /**
     * Initializes the kernel by securely loading critical configuration parameters.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) return;
        
        // Load configuration asynchronously from the secure registry
        // Assuming critical keys are stored under 'governance.oversight.criticalKeys'
        const config = await this.configRegistry.get('governance.oversight.criticalKeys');
        this.criticalKeys = Array.isArray(config) ? config : [];
        
        this.initialized = true;
    }

    /**
     * Loads, verifies, and applies the parameter set corresponding to the provided system state hash.
     * This state is treated as immutable for the current operational cycle.
     * @param {string} versionHash - The cryptographic hash identifying the system state.
     * @returns {Promise<ReadonlyMap<string, *>>} The loaded parameters map.
     */
    async loadState(versionHash) {
        if (!this.initialized) await this.initialize();
        if (typeof versionHash !== 'string' || versionHash.length === 0) {
             throw new Error("OPK_LOAD_ERROR: Invalid version hash provided.");
        }

        // 1. Fetch data payload (Delegated I/O)
        // Replaces _fetchPayload(hash) with IHighEfficiencyStateRetrieverToolKernel
        const rawData = await this.stateRetriever.getStateByHash(versionHash);
        
        // 2. Integrity Verification (Delegated cryptographic check)
        // Replaces ssv.verifyIntegrity
        await this.integrityChecker.verifyDataIntegrity(rawData, versionHash);

        // 3. Application
        this.parameters = new Map(Object.entries(rawData));
        this.currentStateHash = versionHash;

        // Ensure the returned map is immutable
        return Object.freeze(this.parameters);
    }

    /**
     * Retrieves a parameter value.
     * @param {string} key - The parameter identifier.
     * @param {*} [defaultValue=undefined] - Value returned if the key is not found.
     * @returns {*} 
     */
    async get(key, defaultValue = undefined) {
        if (!this.initialized) await this.initialize();

        if (!this.parameters.has(key)) {
            // Delegate critical key check and logging to the specialized evaluator kernel.
            // Replaces kce.execute({ action: 'MISSING_INTEGRITY_CHECK', ... })
            await this.constraintEvaluator.checkMissingParameterIntegrity(
                key, 
                this.criticalKeys, 
                this.currentStateHash
            );
            return defaultValue;
        }
        return this.parameters.get(key);
    }

    /**
     * Proposes a new parameter set change.
     * This method delegates the mutation and consensus process (GSEP Stage 1/2)
     * to the IMutationChainPersistenceToolKernel.
     * @param {string} key - Parameter key.
     * @param {*} value - Proposed new value.
     * @returns {Promise<void>}
     */
    async proposeUpdate(key, value) {
        if (!this.initialized) await this.initialize();

        if (!this.currentStateHash) {
            throw new Error("OPK_PROPOSAL_ERROR: Cannot propose update before loading an initial state hash.");
        }

        // 1. Perform constraint check (Delegated high-level policy enforcement)
        // Replaces kce.execute({ action: 'PROPOSAL_CHECK', ... })
        await this.constraintEvaluator.checkProposalConstraints(
            key, 
            value, 
            this.criticalKeys
        );

        // 2. Delegate GSEP consensus and subsequent chain commitment.
        // Replaces mcr.proposeParameterChange
        await this.mutationPersister.proposeNewParameterState(this.currentStateHash, key, value);

        // 3. Auditable Logging
        // Replaces console.log
        await this.auditLogger.recordAudit({
            eventType: 'GOVERNANCE_PROPOSAL',
            target: 'OversightParameterKernel',
            details: { key, value, sourceHash: this.currentStateHash }
        });
    }
}