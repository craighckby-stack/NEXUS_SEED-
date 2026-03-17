const { ValidationResult } = require('../interfaces/ConfigValidator'); // Assuming typedefs are exported or known globally

/**
 * Manages the collection and concurrent execution of individual validation rules.
 * This decouples specific validation logic (e.g., SchemaCheck, StabilityCheck) 
 * from the main ConfigValidator implementation.
 */
class RuleEngineRegistry {
    constructor() {
        this.rules = [];
    }

    /**
     * Registers a new validation rule module.
     * A rule module must implement an async 'execute(config)' method 
     * that returns a structured ValidationResult segment.
     * @param {Object} ruleModule - An instance of a rule implementation implementing { execute(config) }.
     */
    registerRule(ruleModule) {
        if (typeof ruleModule.execute !== 'function') {
            throw new Error(`Rule module ${ruleModule.constructor.name} must implement an async 'execute(config)' method.`);
        }
        this.rules.push(ruleModule);
    }

    /**
     * Executes all registered rules concurrently against the configuration.
     * @param {Object} config - The configuration object to validate.
     * @returns {Promise<{isValid: boolean, errors: Array}>} Aggregated validation result.
     */
    async runAll(config) {
        if (this.rules.length === 0) {
            return { isValid: true, errors: [] };
        }

        // Execute all rules in parallel
        const validationPromises = this.rules.map(rule => rule.execute(config));

        // Wait for all results and aggregate
        const results = await Promise.all(validationPromises);

        let allErrors = [];
        let globalIsValid = true;

        for (const result of results) {
            // Ensure the result structure adheres to ValidationResult contract
            if (result && result.isValid === false) {
                globalIsValid = false;
                // Aggregate errors, ensuring 'errors' is an array
                allErrors = allErrors.concat(Array.isArray(result.errors) ? result.errors : []);
            }
        }

        return {
            isValid: globalIsValid,
            errors: allErrors
        };
    }
}

module.exports = RuleEngineRegistry;