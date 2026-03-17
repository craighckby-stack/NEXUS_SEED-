// src/errors/policyErrors.js
// Specialized custom errors for Compliance and Policy management

/**
 * Error thrown when a core compliance configuration file fails structural integrity checks.
 */
class PolicyIntegrityError extends Error {
    constructor(message, validationErrors = []) {
        super(message);
        this.name = 'PolicyIntegrityError';
        this.validationErrors = validationErrors; // Stores underlying schema validation errors (e.g., AJV output)
        // Maintain correct stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PolicyIntegrityError);
        }
    }
}

/**
 * Error thrown when the Policy Engine (C-15) determines execution must stop based on policy triggers.
 */
class ComplianceVetoError extends Error {
    constructor(message, triggerDetails = {}) {
        super(message);
        this.name = 'ComplianceVetoError';
        this.triggerDetails = triggerDetails;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ComplianceVetoError);
        }
    }
}

export {
    PolicyIntegrityError,
    ComplianceVetoError
};