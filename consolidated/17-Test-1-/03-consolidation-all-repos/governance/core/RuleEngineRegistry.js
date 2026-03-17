const { ValidationResult } = require('../interfaces/ConfigValidator');

/**
 * Manages the collection and concurrent execution of individual validation rules.
 * This decouples specific validation logic (e.g., SchemaCheck, StabilityCheck) 
 * from the main ConfigValidator implementation.
 */
class RuleEngineRegistry {
    #rules;
    #aggregatorTool;

    /**
     * @param {Object} [aggregatorTool] - Optional dependency injection for the concurrent execution aggregator.
     */
    constructor(aggregatorTool) {
        this.#setupDependencies(aggregatorTool);
    }

    /**
     * Extracts synchronous dependency resolution and initialization, including global dependency lookup.
     * @param {Object} [aggregatorTool] 
     */
    #setupDependencies(aggregatorTool) {
        this.#rules = [];
        
        // Resolve the aggregator tool from injection or global scope.
        this.#aggregatorTool = this.#resolveAggregatorTool(aggregatorTool);
        
        if (!this.#aggregatorTool) {
             this.#logWarning("RuleEngineRegistry initialized without 'ConcurrentValidationAggregator' tool. Execution of runAll() will fail if rules are present.");
        }
    }

    /**
     * I/O Proxy for resolving the aggregator tool, prioritizing injection then global lookup.
     * @param {Object} injectedTool
     * @returns {Object | null}
     */
    #resolveAggregatorTool(injectedTool) {
        if (injectedTool) {
            return injectedTool;
        }
        
        // Accessing the global runtime environment is treated as I/O.
        return global.AGI_KERNEL_TOOLS ? global.AGI_KERNEL_TOOLS.ConcurrentValidationAggregator : null;
    }
    
    /**
     * I/O Proxy for console logging.
     * @param {string} message 
     */
    #logWarning(message) {
        console.warn(message);
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
        this.#rules.push(ruleModule);
    }

    /**
     * Executes all registered rules concurrently against the configuration using the dedicated aggregator tool.
     * @param {Object} config - The configuration object to validate.
     * @returns {Promise<ValidationResult>} Aggregated validation result.
     */
    async runAll(config) {
        if (!this.#aggregatorTool || typeof this.#aggregatorTool.execute !== 'function') {
            throw new Error("Cannot run validations: Required ConcurrentValidationAggregator tool is unavailable or improperly defined.");
        }
        
        // Delegate the complex concurrent execution and aggregation logic to the plugin
        return this.#delegateToAggregatorExecution({
            rules: this.#rules,
            config: config
        });
    }
    
    /**
     * I/O Proxy for executing the external ConcurrentValidationAggregator tool.
     * @param {{rules: Array<Object>, config: Object}} params
     * @returns {Promise<ValidationResult>}
     */
    #delegateToAggregatorExecution(params) {
        return this.#aggregatorTool.execute(params);
    }
}

module.exports = RuleEngineRegistry;