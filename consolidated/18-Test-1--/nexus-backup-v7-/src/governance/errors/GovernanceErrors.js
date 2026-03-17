/**
 * Custom error classes for the Governance subsystem.
 * 
 * NOTE: All errors now include a static CONCEPT_ID, aligning with the 
 * architectural mandate for structured, normalized error handling 
 * (prepares for IErrorDetailNormalizationToolKernel integration).
 */

class GovernanceError extends Error {
    /** Canonical concept identifier for general governance errors. */
    static CONCEPT_ID = 'GOV_E_001';

    /**
     * @param {string} message
     * @param {object} [details={}] Additional error details.
     * @param {string} [conceptId] Override the default concept ID.
     */
    constructor(message, details = {}, conceptId = GovernanceError.CONCEPT_ID) {
        super(message);
        this.name = this.constructor.name;
        this.details = details;
        this.conceptId = conceptId; // Mandatory structured identifier
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error raised when an action payload fails schema validation.
 */
class ActionValidationError extends GovernanceError {
    /** Canonical concept identifier for schema validation failures. */
    static CONCEPT_ID = 'GOV_E_002';

    /**
     * @param {string} message
     * @param {Array<object>} validationErrors Detailed errors from the validator.
     */
    constructor(message, validationErrors = []) {
        // Pass concept ID to super constructor
        super(message, { validationErrors }, ActionValidationError.CONCEPT_ID);
        // Expose validation errors directly on the instance for easier programmatic handling
        this.validationErrors = validationErrors;
    }
}

/**
 * Error raised when the requested executor service cannot be found in the registry.
 */
class ExecutorNotFoundError extends GovernanceError {
    /** Canonical concept identifier for missing execution services. */
    static CONCEPT_ID = 'GOV_E_003';

    /**
     * @param {string} executorId The ID of the missing executor.
     * @param {string} [message] Custom message.
     */
    constructor(executorId, message) {
        const defaultMessage = `Requested executor service not found${executorId ? `: ${executorId}` : '.'}`;
        // Pass concept ID to super constructor
        super(message || defaultMessage, { executorId }, ExecutorNotFoundError.CONCEPT_ID);
        // Expose the missing ID directly
        this.executorId = executorId;
    }
}

module.exports = {
    GovernanceError,
    ActionValidationError,
    ExecutorNotFoundError
};