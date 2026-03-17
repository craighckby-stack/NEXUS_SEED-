import { AuditorError } from '../errors/AuditorError.js';

/**
 * ErrorFactory v1.0.0
 * Standardized factory for creating consistent, structured application errors.
 */
class ErrorFactory {

    /**
     * Creates a new AuditorError instance for security or validation failures.
     * @param {string} message 
     * @param {object} [details={}] - Structured auditing context.
     * @returns {AuditorError}
     */
    static createAuditorError(message, details) {
        return new AuditorError(message, 'AUDIT_FAILURE', details);
    }

    /**
     * Creates a generic operational error (e.g., database timeout).
     * @param {string} message 
     * @param {string} [code='OPERATIONAL_ERROR']
     * @param {Error} [cause]
     * @returns {Error}
     */
    static createOperationalError(message, code = 'OPERATIONAL_ERROR', cause = null) {
        // Note: For a true operational error, a specific subclass of Error (e.g., OperationalError) would be preferred.
        const err = new Error(message);
        err.name = code;
        err.cause = cause; // Standard Node.js practice
        return err;
    }

    // ... other standardized error creation methods (e.g., createUnauthorizedError)
}

export default ErrorFactory;
