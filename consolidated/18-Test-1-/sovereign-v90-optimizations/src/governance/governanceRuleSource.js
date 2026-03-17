/**
 * @typedef {Object} P01Constants
 * @property {number} threshold
 * @property {Object<string, number>} weights
 */
/**
 * @typedef {Object} VetoRule
 * @property {string} id
 * @property {string} description
 * @property {string} policy
 * @property {(number|string)} value
 * @property {string} enforced_by
 */
/**
 * @typedef {Object} GovernanceRuleSchema
 * @property {P01Constants} P01_CRITICALITY
 * @property {VetoRule[]} GSEP_VETO_RULES
 */

// Tool Kernel Interfaces utilized
// const IGovernanceRuleDefinitionsRegistryKernel = 'IGovernanceRuleDefinitionsRegistryKernel';
// const ILoggerToolKernel = 'ILoggerToolKernel';


/**
 * GRSK: GOVERNANCE RULE SOURCE KERNEL (V7.11)
 * Scope: Stage 3/Foundation. Critical dependency for P-01 consensus.
 * Function: Provides an immutable, cryptographically verified source of truth
 * for the core system policy rule sets and fixed P-01 calculation constants.
 * Adheres strictly to AIA mandates for asynchronous initialization and secure dependency injection.
 * (Refactored from synchronous GovernanceRuleSource)
 */
class GovernanceRuleSourceKernel {
    /** @type {IGovernanceRuleDefinitionsRegistryKernel} */
    #ruleRegistry;
    /** @type {ILoggerToolKernel} */
    #logger;

    #currentRuleSetVersion = null;
    /** @type {GovernanceRuleSchema} */
    #immutableRuleset = null;
    #initialized = false;

    /**
     * @param {Object} dependencies
     * @param {IGovernanceRuleDefinitionsRegistryKernel} dependencies.ruleRegistry
     * @param {ILoggerToolKernel} dependencies.logger
     */
    constructor({ ruleRegistry, logger }) {
        if (!ruleRegistry || !logger) {
            // Using GOV_E_004 as conceptual error ID for foundational initialization failures.
            throw new Error("GOV_E_004: GRSK initialization requires ruleRegistry and logger kernels.");
        }
        this.#ruleRegistry = ruleRegistry;
        this.#logger = logger;
    }

    /**
     * Asynchronously loads and verifies the foundational governance ruleset.
     * This replaces the synchronous #initializeSource and #fetchVerifiedRuleset,
     * ensuring compliance with the AIA Enforcement Layer for non-blocking configuration load.
     * @async
     */
    async initialize() {
        if (this.#initialized) {
            this.#logger.warn("GRSK already initialized. Skipping initialization.");
            return;
        }

        try {
            // Load ruleset via the high-integrity asynchronous registry.
            // The registry (IGovernanceRuleDefinitionsRegistryKernel) is responsible for 
            // cryptographic verification, hash checking, and returning an immutable (frozen) structure.
            const verifiedSource = await this.#ruleRegistry.getRuleDefinitions();
            
            this.#currentRuleSetVersion = verifiedSource.version;
            this.#immutableRuleset = verifiedSource.ruleset; 

            // Post-Load integrity checks (schema adherence)
            this.#validateRulesetIntegrity(this.#immutableRuleset);

            this.#logger.info(`GRSK successfully loaded and validated ruleset version: ${this.#currentRuleSetVersion}`);
            this.#initialized = true;

        } catch (error) {
            const message = "GRSK Critical initialization failure. System cannot proceed without foundational rules.";
            this.#logger.error(message, { error: error.message, conceptId: 'GOV_E_004' });
            // Re-throw to halt system startup.
            throw new Error(`GOV_E_004: GRSK Initialization failed: ${error.message}`);
        }
    }

    /**
     * Ensures the ruleset conforms to the required schema.
     * @param {GovernanceRuleSchema} ruleset 
     */
    #validateRulesetIntegrity(ruleset) {
        if (!ruleset || typeof ruleset.P01_CRITICALITY !== 'object' || !Array.isArray(ruleset.GSEP_VETO_RULES)) {
            const message = "GRSK integrity failure: Ruleset schema mismatch after registry load.";
            this.#logger.error(message, { ruleset, conceptId: 'GOV_E_004' });
            throw new Error(message);
        }
        // Note: Further deep structure validation is expected to be handled by the registry kernel internally.
    }

    /**
     * @returns {string} The cryptographically attested version string of the loaded ruleset.
     */
    getRulesetVersion() {
        if (!this.#initialized) {
            this.#logger.error("GRSK::NOT_INITIALIZED - Attempted to access ruleset version before initialization.");
            return null;
        }
        return this.#currentRuleSetVersion;
    }

    /**
     * Returns the immutable mandatory GSEP policies.
     * Immutability is guaranteed by the contract of IGovernanceRuleDefinitionsRegistryKernel, 
     * eliminating the need for synchronous defensive copying (#cloneRuleData).
     * @returns {VetoRule[]} 
     */
    getMandatoryVetoPolicies() {
        if (!this.#initialized) {
            this.#logger.error("GRSK::NOT_INITIALIZED - Attempted to access Veto Policies before initialization.");
            return [];
        }
        return this.#immutableRuleset.GSEP_VETO_RULES;
    }

    /**
     * Returns the immutable P01 calculation constants.
     * @returns {P01Constants}
     */
    getP01Constants() {
        if (!this.#initialized) {
            this.#logger.error("GRSK::NOT_INITIALIZED - Attempted to access P01 Constants before initialization.");
            return null;
        }
        return this.#immutableRuleset.P01_CRITICALITY;
    }

    /**
     * Retrieves an immutable rule block.
     * @param {string} key - The key of the ruleset block (e.g., 'P01_CRITICALITY').
     * @returns {Object|Array} The immutable rule block data.
     */
    getRuleBlock(key) {
        if (!this.#initialized) {
            this.#logger.error("GRSK::NOT_INITIALIZED - Attempted to access rule block before initialization.");
            return undefined;
        }
        const ruleBlock = this.#immutableRuleset[key];
        if (ruleBlock === undefined) {
            this.#logger.warn(`GRSK::RULE_NOT_FOUND - Unknown rule block requested: ${key}`);
        }
        return ruleBlock;
    }
}

module.exports = GovernanceRuleSourceKernel;