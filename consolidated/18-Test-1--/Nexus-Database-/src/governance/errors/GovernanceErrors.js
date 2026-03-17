/**
 * Custom error classes for the Governance subsystem.
 */

class GovernanceError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.details = details;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error raised when an action payload fails schema validation.
 */
class ActionValidationError extends GovernanceError {
    constructor(message, validationErrors = []) {
        super(message, { validationErrors });
    }
}

/**
 * Error raised when the requested executor service cannot be found in the registry.
 */
class ExecutorNotFoundError extends GovernanceError {}

module.exports = {
    GovernanceError,
    ActionValidationError,
    ExecutorNotFoundError
};