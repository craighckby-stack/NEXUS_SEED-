const { ConfigValidator, ValidationResult } = require('../interfaces/ConfigValidator');

/**
 * Service responsible for registering Governance Rule Checking Modules (GRCMs)
 * and aggregating their validation results into a single system report.
 */
class ValidationOrchestrator {
    /** @type {ConfigValidator[]} */
    #validators;
    /** @type {import('../plugins/TaskAggregator')} */
    #aggregator;

    // --- Private Constants ---
    static DEPENDENCY_ERROR_PREFIX = '[ValidationOrchestrator] Dependency Error: ';
    static REGISTRATION_ERROR_PREFIX = 'Registration Error: ';

    // --- Private Methods ---

    /**
     * Throws a dependency error with the provided message.
     * @param {string} message - The error message.
     * @throws {Error}
     */
    #throwDependencyError(message) {
        throw new Error(`${ValidationOrchestrator.DEPENDENCY_ERROR_PREFIX}${message}`);
    }

    /**
     * Throws a registration error with the provided message.
     * @param {string} message - The error message.
     * @throws {Error}
     */
    #throwRegistrationError(message) {
        throw new Error(`${ValidationOrchestrator.REGISTRATION_ERROR_PREFIX}${message}`);
    }

    /**
     * Delegates concurrent execution and result aggregation to the TaskAggregator.
     * @param {Promise<ValidationResult>[]} promises - Array of validation promises.
     * @returns {Promise<ValidationResult>} Aggregated validation results.
     */
    #delegateToAggregatorExecution(promises) {
        return this.#aggregator.execute(promises);
    }

    // --- Setup and Initialization ---

    /**
     * Initializes the orchestrator with required dependencies.
     * @param {object} dependencies - Dependencies injected by the system.
     * @param {import('../plugins/TaskAggregator')} dependencies.TaskAggregator - The tool for concurrent execution and result aggregation.
     */
    #setupDependencies(dependencies) {
        const { TaskAggregator } = dependencies;

        if (!TaskAggregator) {
            this.#throwDependencyError("TaskAggregator tool instance is missing.");
        }

        this.#aggregator = TaskAggregator;
        this.#validators = [];
    }

    // --- Public API ---

    /**
     * Creates a new ValidationOrchestrator instance.
     * @param {object} dependencies - Dependencies injected by the system.
     * @param {import('../plugins/TaskAggregator')} dependencies.TaskAggregator - The tool for concurrent execution and result aggregation.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Registers a concrete governance validator module.
     * @param {ConfigValidator} validatorInstance - An instance of a concrete ConfigValidator subclass.
     * @throws {Error} If the validator instance doesn't implement the required interface.
     */
    registerValidator(validatorInstance) {
        if (!(validatorInstance instanceof ConfigValidator)) {
            this.#throwRegistrationError("Attempted to register object that doesn't implement ConfigValidator interface.");
        }
        
        this.#validators.push(validatorInstance);
    }

    /**
     * Executes all registered validators against the proposed configuration concurrently.
     * @param {Object} config - The configuration payload to validate.
     * @returns {Promise<ValidationResult>} Unified validation results.
     */
    async validateSystemConfig(config) {
        if (this.#validators.length === 0) {
            return { isValid: true, errors: [] };
        }

        const promises = this.#validators.map(validator => validator.validate(config));
        return this.#delegateToAggregatorExecution(promises);
    }
}

module.exports = ValidationOrchestrator;
