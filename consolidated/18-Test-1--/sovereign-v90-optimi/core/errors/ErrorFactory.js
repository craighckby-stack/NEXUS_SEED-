import { AuditorError } from '../errors/AuditorError.js';
// Explicitly import the core utility for standardized error generation, ensuring structural integrity
// and removing reliance on implicit global scope.
import { StandardErrorGeneratorPlugin } from '../utils/StandardErrorGeneratorPlugin.js'; 

/**
 * ErrorFactory v1.0.1
 * Standardized factory for creating consistent, structured application errors.
 */
class ErrorFactory {

    /**
     * Private I/O proxy function to delegate the standardized creation call
     * to the external StandardErrorGeneratorPlugin dependency.
     * @param {string} message 
     * @param {string} code 
     * @param {Error | null} cause
     * @returns {Error}
     */
    static #delegateToStandardGenerator(message, code, cause) {
        return StandardErrorGeneratorPlugin.createOperationalError(message, code, cause);
    }

    /**
     * Creates a new AuditorError instance for security or validation failures.
     * @param {string} message 
     * @param {object} [details={}] - Structured auditing context.
     * @returns {AuditorError}
     */
    static createAuditorError(message, details = {}) {
        // This remains local as it depends on the imported domain-specific class AuditorError
        return new AuditorError(message, 'AUDIT_FAILURE', details);
    }

    /**
     * Creates a generic operational error (e.g., database timeout).
     * Now delegates structural creation to a private I/O proxy.
     * @param {string} message 
     * @param {string} [code='OPERATIONAL_ERROR']
     * @param {Error | null} [cause=null]
     * @returns {Error}
     */
    static createOperationalError(message, code = 'OPERATIONAL_ERROR', cause = null) {
        // Delegate the standardized structuring and creation to the internal I/O proxy.
        return this.#delegateToStandardGenerator(message, code, cause);
    }

    // ... other standardized error creation methods (e.g., createUnauthorizedError)
}

export default ErrorFactory;