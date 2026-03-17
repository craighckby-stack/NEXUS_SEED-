const { ILoggerToolKernel, ISpecValidatorKernel, IGovernanceConstantsV2ConfigRegistryKernel, PayloadSchemaRegistryKernel, IProposalHistoryConfigRegistryKernel, IEventFactoryGeneratorToolKernel, HashIntegrityCheckerToolKernel } = require('core_interfaces');

/**
 * DynamicConstraintGeneratorKernel (DCG Kernel)
 * Mandate: Asynchronously translates refined governance model insights (GMRE) into
 * validated, concrete M-01 executable constraint updates for the GRS (Governance Rule Source).
 * Enforces AIA integrity mandates via injected tool kernels for validation and hashing.
 */
class DynamicConstraintGeneratorKernel {
    /**
     * @param {Object} dependencies
     * @param {ILoggerToolKernel} dependencies.logger - Auditable logging service.
     * @param {ISpecValidatorKernel} dependencies.specValidator - Schema validation tool.
     * @param {IGovernanceConstantsV2ConfigRegistryKernel} dependencies.governanceConstantsRegistry - Registry for governance constants.
     * @param {PayloadSchemaRegistryKernel} dependencies.payloadSchemaRegistry - Registry for governance payload schemas.
     * @param {IProposalHistoryConfigRegistryKernel} dependencies.proposalHistoryRegistry - Access to current GRS/Policy context.
     * @param {IEventFactoryGeneratorToolKernel} dependencies.eventFactoryGenerator - Tool for generating structured events/intents (including UUIDs).
     * @param {HashIntegrityCheckerToolKernel} dependencies.hashIntegrityChecker - Tool for ensuring M-01 package integrity.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
        this.isInitialized = false;
    }

    #setupDependencies(dependencies) {
        const { logger, specValidator, governanceConstantsRegistry, payloadSchemaRegistry, proposalHistoryRegistry, eventFactoryGenerator, hashIntegrityChecker } = dependencies;

        if (!logger || !specValidator || !governanceConstantsRegistry || !payloadSchemaRegistry || !proposalHistoryRegistry || !eventFactoryGenerator || !hashIntegrityChecker) {
            throw new Error("DynamicConstraintGeneratorKernel Initialization Error: Missing one or more required high-integrity dependencies.");
        }

        this.logger = logger;
        this.specValidator = specValidator;
        this.governanceConstantsRegistry = governanceConstantsRegistry;
        this.payloadSchemaRegistry = payloadSchemaRegistry;
        this.proposalHistoryRegistry = proposalHistoryRegistry;
        this.eventFactoryGenerator = eventFactoryGenerator;
        this.hashIntegrityChecker = hashIntegrityChecker;
    }

    /**
     * Asynchronously loads required constants and schemas, completing kernel initialization.
     */
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn({ message: "DynamicConstraintGeneratorKernel already initialized." });
            return;
        }
        
        // Load critical components asynchronously from high-integrity registries
        this.CONSTANTS = await this.governanceConstantsRegistry.getConstants();
        this.MUTATION_KEYS = await this.governanceConstantsRegistry.getMutationKeys();
        
        // Load required input schema from the high-integrity registry
        this.RefinementProposalSchema = await this.payloadSchemaRegistry.getSchema('RefinementProposalSchema');

        if (!this.RefinementProposalSchema) {
            throw new Error("DCG Kernel failed to load RefinementProposalSchema from registry.");
        }

        this.logger.info({ message: "DynamicConstraintGeneratorKernel initialized successfully.", version: this.CONSTANTS.VERSION });
        this.isInitialized = true;
    }

    /**
     * Translates the refinement proposal into a formal, executable M-01 policy package.
     * @param {Object} refinementProposal - Output from the Governance Model Refinement Engine (GMRE).
     * @returns {Promise<Object|null>} M-01 Package containing required updates for GRS, or null if no actionable changes are derived.
     */
    async generatePolicyUpdate(refinementProposal) {
        if (!this.isInitialized) {
            throw new Error("DCG Kernel must be initialized before use.");
        }

        if (!refinementProposal || typeof refinementProposal !== 'object' || Object.keys(refinementProposal).length === 0) {
            this.logger.error({ code: 'E101', message: this.CONSTANTS.E101_EMPTY_PROPOSAL });
            throw new Error(this.CONSTANTS.E101_EMPTY_PROPOSAL);
        }

        // 1. Validation Trace
        await this._validateInputProposal(refinementProposal);

        // 2. Fetch current GRS context
        const currentGRSContext = await this.proposalHistoryRegistry.getCurrentPolicyContextSnapshot();
        
        // 3. Derivation
        const newConstraints = this._mapProposalToConstraints(refinementProposal, currentGRSContext);
        
        if (Object.keys(newConstraints).length === 0) {
            this.logger.info({ 
                code: 'W203', 
                message: this.CONSTANTS.W203_ZERO_ACTIONS, 
                contextTimestamp: currentGRSContext.timestamp 
            });
            return null;
        }
        
        // 4. M-01 Package Creation using IEventFactoryGeneratorToolKernel (replaces ad-hoc package creation)
        let m01Package = await this.eventFactoryGenerator.createGovernanceIntent({
            intentType: this.MUTATION_KEYS.POLICY_UPDATE,
            targetKernel: 'GRSKernel', 
            payload: newConstraints,
            metadata: {
                gmreProposalId: refinementProposal.proposalId || 'N/A',
                contextSnapshotTime: currentGRSContext.timestamp,
                derivedConstraintCount: Object.keys(newConstraints).length,
            },
            sourceEngine: this.CONSTANTS.VERSION,
        });

        // 5. Finalization (Hashing and Integrity Check) - AIA Enforcement Layer Mandate
        const payloadHash = await this.hashIntegrityChecker.calculateHash(m01Package.payload);
        
        // Update metadata with the mandatory integrity hash
        if (!m01Package.metadata) m01Package.metadata = {};
        m01Package.metadata.payloadHash = payloadHash;
        
        this.logger.debug({ 
            message: "M-01 Package finalized with integrity hash.", 
            intentId: m01Package.intentId, 
            hash: payloadHash 
        });
        
        return m01Package;
    }

    /**
     * Deterministically maps GMRE metrics to structured GRS constraints, leveraging current context.
     * @private
     */
    _mapProposalToConstraints(proposal, context) {
        const updates = {};
        const MIN_ACTIONABLE_DELTA = this.CONSTANTS.MIN_ACTIONABLE_DELTA;

        // S-02 Adjustment Derivation (Risk Floors)
        if (proposal.optimalS02Adjustment !== undefined && Math.abs(proposal.optimalS02Adjustment) > MIN_ACTIONABLE_DELTA) {
            updates[this.MUTATION_KEYS.S02_RISK_FLOOR_DELTA] = proposal.optimalS02Adjustment;
        }

        // S-03 Hard Policy Derivation (Veto Rules)
        if (Array.isArray(proposal.recommendedVetoRules) && proposal.recommendedVetoRules.length > 0) {
             // Filter out any rules already present (ensuring idempotence)
            const activeVetoRules = context.activeVetoRules || []; 
            const rulesToAdd = proposal.recommendedVetoRules.filter(
                rule => !activeVetoRules.some(existing => existing.ruleId === rule.ruleId)
            );
            
            if (rulesToAdd.length > 0) {
                updates[this.MUTATION_KEYS.S03_VETO_RULES_ADD] = rulesToAdd;
            }
        }

        return updates;
    }
    
    /** 
     * @private Ensures input conformity against a known governance schema using ISpecValidatorKernel. 
     */
    async _validateInputProposal(proposal) {
        
        const validationResult = await this.specValidator.validate(proposal, this.RefinementProposalSchema);
        
        if (validationResult.isValid === false) {
            const errorDetails = validationResult.errors.map(d => d.message).join('; ');
            this.logger.error({ 
                code: 'DCG_E302', 
                message: `Input Validation Failure: ${errorDetails}`,
                details: errorDetails
            });
            // Throw structured error for programmatic handling
            throw Object.assign(new Error("Policy proposal failed input schema validation."), { 
                code: 'DCG_E302_VALIDATION', 
                details: errorDetails 
            });
        }
    }
}

module.exports = DynamicConstraintGeneratorKernel;