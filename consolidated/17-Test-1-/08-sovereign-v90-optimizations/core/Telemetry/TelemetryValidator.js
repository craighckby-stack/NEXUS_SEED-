/**
 * TelemetryValidator
 * Autonomous runtime service for validating event payloads against GAXEventSchema.
 * Ensures all outgoing telemetry adheres to type, format, and constraint specifications.
 */

const DeclarativeEventSchemaValidator = require('@kernel/tools/DeclarativeEventSchemaValidator'); 
const GAXEventSchema = Object.freeze(require('./GAXEventSchema'));

class TelemetryValidator {
    /**
     * Executes the core validation logic using the external declarative tool.
     * @param {Object} schema - The validation schema definition.
     * @param {Object} payload - The raw data object to validate.
     * @returns {Object} { isValid: boolean, errors: Array<string> }
     */
    static #executeValidationDelegation({ schema, payload }) {
        // Delegate the core validation logic (required, type, enum, strictness) to the specialized, reusable tool.
        // Tool interface: .validate({ schema, payload }) -> { isValid, errors }
        return DeclarativeEventSchemaValidator.validate({ schema, payload });
    }

    /**
     * Validates a raw event payload against its defined schema using the declarative validator tool.
     * @param {string} eventName - The key name of the event (e.g., 'SYS:INIT:START').
     * @param {Object} payload - The raw data object to validate.
     * @returns {Object} { isValid: boolean, errors: Array<string> }
     */
    static validate(eventName, payload) {
        // Using the frozen GAXEventSchema ensures read-only access to the validation rules.
        const definition = GAXEventSchema[eventName];
        
        if (!definition) {
            return {
                isValid: false,
                errors: [`Unknown event name: ${eventName}`]
            };
        }

        // Destructure the specific validation schema required by the DeclarativeEventSchemaValidator.
        const { schema } = definition;

        // Robustness check: Ensure the definition structure is not malformed.
        if (!schema) {
            return {
                isValid: false,
                errors: [`Internal Error: Definition for ${eventName} found, but 'schema' property is missing or null.`]
            };
        }
        
        return this.#executeValidationDelegation({ schema, payload });
    }
}

module.exports = TelemetryValidator;