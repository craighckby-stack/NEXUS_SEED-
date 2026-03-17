/**
 * ValidationRuleConfigRegistry
 * Encapsulates and provides immutable access to the Sovereign AGI Validation Rule Configuration Registry.
 * This structure ensures that rule definitions cannot be mutated at runtime by external consumers.
 */
class ValidationRuleConfigRegistry {
    // Private fields holding the frozen configuration data
    #RuleSeverity;
    #RuleType;
    #chrSpecRules;
    #policyRules;

    /**
     * Initializes the registry, loading and freezing all configurations.
     */
    constructor() {
        // [STRATEGIC GOAL: Synchronous setup extraction]
        this.#setupConfiguration();
    }

    /**
     * Loads, defines, and rigorously freezes all configuration data for immutability.
     * @private
     */
    #setupConfiguration() {
        this.#RuleSeverity = Object.freeze({
            ERROR: 'ERROR',     // Blocks execution/deployment
            WARNING: 'WARNING', // Permitted, but logged for review
            INFO: 'INFO'        // Informational checks
        });

        this.#RuleType = Object.freeze({
            COHERENCE: 'COHERENCE', // Checks related entity consistency
            VERSIONING: 'VERSIONING', // Checks dependency compatibility
            STRUCTURAL: 'STRUCTURAL', // Checks required fields and data format
            POLICY: 'POLICY' // Checks against governance or ethical constraints
        });

        // Define rules array
        const chrRules = [
            {
                id: 'spec.memoryLimitCoherence',
                type: this.#RuleType.COHERENCE,
                severity: this.#RuleSeverity.ERROR,
                description: 'Ensure hard memory limit is not below the soft limit set in configuration.',
                targetPath: 'config.memoryLimits',
                handlerId: 'MemoryRuleHandler.checkLimitCoherence'
            },
            {
                id: 'spec.dependencyCompatibility',
                type: this.#RuleType.VERSIONING,
                severity: this.#RuleSeverity.ERROR,
                description: 'Verify all required internal component versions are compatible with the current runtime protocol.',
                targetPath: 'dependencies',
                handlerId: 'SystemRuleHandler.checkRuntimeCompatibility'
            },
            {
                id: 'spec.requiredFieldsExist',
                type: this.#RuleType.STRUCTURAL,
                severity: this.#RuleSeverity.ERROR,
                description: 'Verify core mandatory fields (like Agent ID and Mission Objective) are defined.',
                targetPath: 'metadata',
                handlerId: 'StructuralRuleHandler.checkRequiredFields'
            }
        ];
        
        // Freeze rule objects and the containing array for deep immutability.
        this.#chrSpecRules = Object.freeze(chrRules.map(Object.freeze));
        this.#policyRules = Object.freeze([]);
    }

    // --- Public Accessors (I/O Proxies for Configuration Data) ---

    /**
     * Simple I/O proxy wrapper for configuration retrieval. 
     * @param {*} data 
     * @private
     */
    #delegateToConfigurationAccess(data) {
        // Returns the frozen data structure.
        return data; 
    }

    /**
     * Retrieves the frozen RuleSeverity constants.
     * @returns {Object}
     */
    get RuleSeverity() {
        return this.#delegateToConfigurationAccess(this.#RuleSeverity);
    }

    /**
     * Retrieves the frozen RuleType constants.
     * @returns {Object}
     */
    get RuleType() {
        return this.#delegateToConfigurationAccess(this.#RuleType);
    }

    /**
     * Retrieves the frozen list of rules applicable to CHR Generation Specification.
     * @returns {Array<ValidationRule>}
     */
    get chrSpecRules() {
        return this.#delegateToConfigurationAccess(this.#chrSpecRules);
    }

    /**
     * Retrieves the frozen list of policy and governance rules.
     * @returns {Array<ValidationRule>}
     */
    get policyRules() {
        return this.#delegateToConfigurationAccess(this.#policyRules);
    }
}

module.exports = ValidationRuleConfigRegistry;