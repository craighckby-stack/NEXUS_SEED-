/**
 * AGI-KERNEL v7.11.3 - Configuration Integrity and Policy Enforcement Kernel
 * Refactored from ConfigurationIntegrityService.js
 */
class ConfigurationIntegrityKernel {
    #schema;
    #defaults;
    #policies;
    #deepInitializer;

    /**
     * @param {object} dependencies
     * @param {object} dependencies.schema - Joi/Zod like schema definition.
     * @param {object} dependencies.defaults - Default values for the configuration structure.
     * @param {function[]} dependencies.policies - Array of functions to enforce runtime constraints.
     * @param {function} dependencies.deepInitializer - The DeepInitializer kernel plugin utility.
     */
    constructor({ schema, defaults, policies = [], deepInitializer }) {
        this.#setupDependencies({ schema, defaults, policies, deepInitializer });
    }

    /**
     * Synchronously validates and assigns all required internal dependencies.
     * @private
     */
    #setupDependencies({ schema, defaults, policies, deepInitializer }) {
        if (!schema || typeof schema !== 'object') {
            this.#throwSetupError('A valid schema definition is required.');
        }
        if (typeof deepInitializer !== 'function') {
            this.#throwSetupError('The DeepInitializer function must be provided (Kernel Plugin missing).');
        }

        this.#schema = schema;
        this.#defaults = defaults;
        this.#policies = policies;
        this.#deepInitializer = deepInitializer;
    }

    /**
     * Validates a configuration object against the defined schema.
     * Throws an error if validation fails.
     * @param {object} config - The configuration object to validate.
     * @returns {object} The validated configuration object.
     */
    validate(config) {
        const validationResult = this.#delegateToInternalValidator(config);

        if (validationResult.error) {
            this.#throwValidationError(validationResult.error.message);
        }

        return validationResult.value;
    }

    /**
     * Migrates the configuration: ensures defaults are applied and structure is initialized.
     * This method handles structural integrity before validation using the DeepInitializer plugin.
     * @param {object} config - The raw configuration object.
     * @returns {object} The migrated and initialized configuration object.
     */
    migrate(config) {
        return this.#delegateToDeepInitializer(config, this.#defaults);
    }

    /**
     * Enforces runtime policies (e.g., dynamic constraints, limits, environment-specific overrides).
     * @param {object} config - The configuration object (usually post-validation/migration).
     * @returns {object} The configuration object with policies applied.
     */
    enforce(config) {
        return this.#executePolicyEnforcement(config, this.#policies);
    }

    // --- I/O PROXY METHODS ---

    /**
     * Proxy for schema validation execution.
     * @private
     */
    #delegateToInternalValidator(config) {
        return this.#executeSchemaValidation(config, this.#schema);
    }

    /**
     * Proxy for external DeepInitializer utility execution.
     * @private
     */
    #delegateToDeepInitializer(config, defaults) {
        return this.#deepInitializer(config, defaults);
    }

    /**
     * Executes the sequence of configuration policies.
     * @private
     */
    #executePolicyEnforcement(initialConfig, policies) {
        let enforcedConfig = { ...initialConfig };

        for (const policy of policies) {
            if (typeof policy !== 'function') {
                this.#logSkippedPolicyWarning();
                continue;
            }
            try {
                const result = policy(enforcedConfig);
                if (!result) {
                    this.#throwPolicyEnforcementError('Policy execution returned a falsy value. Must return the updated config.');
                }
                enforcedConfig = result;
            } catch (error) {
                // Fail fast on policy breaches or internal policy errors
                this.#throwPolicyEnforcementError(`Policy enforcement failed during execution: ${error.message}`);
            }
        }
        return enforcedConfig;
    }

    // --- EXECUTION & ERROR HANDLING METHODS ---

    /**
     * Internal placeholder for complex schema validation logic.
     * (Formerly _internalSchemaValidator)
     * @private
     */
    #executeSchemaValidation(config, schema) {
        // Mocked implementation
        if (schema && typeof config !== 'object') {
             return { error: { message: 'Config must be an object' }, value: null };
        }
        return { error: null, value: config };
    }

    /**
     * Throws an error related to Kernel initialization failure.
     * @private
     */
    #throwSetupError(message) {
        throw new Error(`ConfigurationIntegrityKernel Setup Error: ${message}`);
    }

    /**
     * Throws a configuration validation error.
     * @private
     */
    #throwValidationError(message) {
        throw new Error(`Configuration Validation Failed: ${message}`);
    }

    /**
     * Throws a policy enforcement execution error.
     * @private
     */
    #throwPolicyEnforcementError(message) {
        throw new Error(message);
    }

    /**
     * Logs a warning when a policy is skipped.
     * @private
     */
    #logSkippedPolicyWarning() {
        console.warn('Skipping non-function policy encountered in ConfigurationIntegrityKernel.');
    }
}

module.exports = ConfigurationIntegrityKernel;
