const GATE_SCHEMA = require('../config/governance/P01_Gate_Schema.json');

/**
 * Validates a configuration instance against the P01 Governance Gate Schema 
 * using the standardized AjvSchemaValidator plugin.
 *
 * NOTE: This relies on the 'AjvSchemaValidator' plugin being available in the runtime context.
 *
 * @param {object} gateConfig - The specific gate definition to validate.
 * @returns {boolean} - True if valid, throws error if invalid.
 */
class GateSchemaValidator {
    #validator;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Initializes internal state and sets up required dependencies.
     * Satisfies synchronous setup extraction goal.
     * @private
     */
    #setupDependencies() {
        this.#validator = this.#delegateToValidatorCreation(GATE_SCHEMA);
    }

    /**
     * Delegates creation of the validation tool instance (AjvSchemaValidator).
     * Satisfies I/O proxy creation goal for external dependency instantiation.
     * @private
     */
    #delegateToValidatorCreation(schema) {
        // AjvSchemaValidator handles schema compilation and standardized error execution logic.
        return new AjvSchemaValidator(schema);
    }

    /**
     * Executes the validation against the configured schema via the external tool.
     * Satisfies I/O proxy creation goal for external dependency execution.
     * @private
     */
    #delegateToValidationExecution(config, errorMessage) {
        return this.#validator.validate(
            config,
            errorMessage
        );
    }

    /**
     * Executes the validation process.
     * @param {object} gateConfig - The specific gate definition to validate.
     * @returns {boolean} - True if valid, throws error if invalid.
     */
    verify(gateConfig) {
        return this.#delegateToValidationExecution(
            gateConfig,
            'Gate Configuration Invalid'
        );
    }
}

module.exports = new GateSchemaValidator();