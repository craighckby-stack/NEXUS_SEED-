/**
 * @fileoverview Base class for all custom application and domain errors.
 */

/**
 * BaseCustomError
 * Enforces standardized structure, error codes, and causality chaining 
 * for all custom exceptions within the system.
 */
class BaseCustomError extends Error {
    /**
     * Standardized error code placeholder. Should be overridden by subclasses.
     */
    static CODE = 'E_SYSTEM_ERROR';

    /**
     * @param {string} message - Human-readable error message.
     * @param {object} [options={}] - Configuration options for the error.
     * @param {object} [options.details={}] - Specific context/data related to the error.
     * @param {Error} [options.cause] - The underlying error that triggered this exception.
     */
    constructor(message, options = {}) {
        const { details = {}, cause } = options;
        
        // Initialize standard Error fields, including cause (Node >= 16.9.0)
        super(message, { cause });

        // Ensure name reflects the class that instantiated it
        this.name = this.constructor.name;
        
        // Assign the class's static CODE property (defaulting to E_SYSTEM_ERROR)
        this.code = this.constructor.CODE;
        
        // Attach additional details
        this.details = details;
    }
}

module.exports = { BaseCustomError };
