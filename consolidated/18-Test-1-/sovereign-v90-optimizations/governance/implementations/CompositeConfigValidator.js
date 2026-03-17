/**
 * A highly optimized Composite Validator implementation leveraging the
 * ValidationAggregator plugin for efficient execution and error aggregation.
 */
class CompositeConfigValidator {
    #validators;
    #aggregator;

    /**
     * @param {Array<Object>} initialValidators - Objects implementing the validate(config) method.
     */
    constructor(initialValidators = []) {
        this.#setupDependencies(initialValidators);
    }

    /**
     * Extracts synchronous dependency resolution and initialization.
     * @param {Array<Object>} initialValidators
     */
    #setupDependencies(initialValidators) {
        // The internal collection of validators, shared with the aggregator.
        this.#validators = initialValidators;

        // Delegate core logic to the optimized plugin kernel via proxy resolution.
        this.#aggregator = this.#resolveValidationAggregator(this.#validators);
    }

    /**
     * I/O Proxy: Resolves and instantiates the external ValidationAggregator tool.
     * Note: Assumes ValidationAggregator is available in scope (e.g., via module import).
     * @param {Array<Object>} validators
     * @returns {ValidationAggregator}
     */
    #resolveValidationAggregator(validators) {
        // Check for global availability, mimicking dependency injection/resolution
        if (typeof ValidationAggregator === 'undefined') {
             throw new Error("Required dependency 'ValidationAggregator' not found.");
        }
        return new ValidationAggregator(validators);
    }

    /**
     * Adds a validator dynamically. Ensures runtime validation contract.
     * O(1) complexity.
     * @param {Object} validator 
     */
    addValidator(validator) {
        if (!validator || typeof validator.validate !== 'function') {
            throw new TypeError("Validator must be an object exposing a function named 'validate'.");
        }
        // Push directly to the shared array
        this.#validators.push(validator);
    }

    /**
     * I/O Proxy: Delegates the validation execution to the aggregated tool.
     * @param {Object} config 
     * @returns {Array<Object>}
     */
    #delegateToAggregatorExecution(config) {
        return this.#aggregator.execute(config);
    }

    /**
     * Validates the configuration by delegating execution to the aggregated validators.
     * The core aggregation loop runs with maximum computational efficiency (direct iteration).
     * @param {Object} config 
     * @returns {Array<Object>} List of validation errors, or empty array if valid.
     */
    validate(config) {
        return this.#delegateToAggregatorExecution(config);
    }
}

// export default CompositeConfigValidator;