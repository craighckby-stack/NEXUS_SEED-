const { RobustCustomError } = require('@core/errors/RobustCustomError');

/**
 * PolicyVerificationErrors.js
 * Sovereign AGI v94.1 Structured Error Definitions
 * Provides custom error classes for robust error handling and categorization 
 * within the Policy Formal Verification Unit.
 */

class PolicyVerificationError extends RobustCustomError {
    static STATUS_CODE = 'PVF_ERROR';

    constructor(message, status = PolicyVerificationError.STATUS_CODE) {
        super(message);
        // RobustCustomError handles stack trace capture and setting the name.
        this.status = status;
    }
}

/**
 * Private helper function to encapsulate the synchronous, repetitive logic for defining
 * a standardized PolicyVerificationError derived class, including setting the static
 * status code and providing a constructor with a default message.
 *
 * @param {string} name The desired class name.
 * @param {string} statusCode The unique status code for the error.
 * @param {string} defaultMessage The message used if none is provided during instantiation.
 * @returns {typeof PolicyVerificationError} A new class extending PolicyVerificationError.
 */
const _definePolicyErrorClass = (name, statusCode, defaultMessage) => {
    const DerivedError = class extends PolicyVerificationError {
        static STATUS_CODE = statusCode;

        constructor(message = defaultMessage) {
            // Delegate message and specific status code to the base class constructor.
            super(message, statusCode);
        }
    };
    // Ensure the generated class has the correct name for stack traces/debugging
    Object.defineProperty(DerivedError, 'name', { value: name });
    return DerivedError;
};

const PolicyConfigError = _definePolicyErrorClass(
    'PolicyConfigError',
    'CONFIG_LOAD_FAILURE',
    "Configuration required for verification failed to load or was invalid."
);

const PolicySchemaValidationError = _definePolicyErrorClass(
    'PolicySchemaValidationError',
    'SCHEMA_VIOLATION',
    "Proposed policy update failed structural schema validation."
);

const PolicyAxiomaticViolationError = _definePolicyErrorClass(
    'PolicyAxiomaticViolationError',
    'FAILURE_AXIOMATIC',
    "Formal Verification Engine detected a violation of core policy axioms."
);

module.exports = {
    PolicyVerificationError,
    PolicyConfigError,
    PolicySchemaValidationError,
    PolicyAxiomaticViolationError
};