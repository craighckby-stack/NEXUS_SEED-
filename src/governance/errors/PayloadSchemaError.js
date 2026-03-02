/**
 * @fileoverview Custom error class for failures encountered during Payload Specification Engine validation.
 * Optimizing for encapsulation, efficiency, and structured abstraction using modern ES Class features.
 */

class PayloadSchemaError extends Error {
    // Standard HTTP status code for client payload validation errors.
    static HTTP_STATUS = 400;
    // Internal standardized code for auditing.
    static ERROR_CODE = 'GOV_MPSE_BREACH';

    // Private fields for enhanced encapsulation (recursive abstraction).
    #validationDetails;
    #failedPayload;

    // Efficient class property initialization (constant per instance type).
    name = 'PayloadSchemaError';
    isOperational = true; 
    status = PayloadSchemaError.HTTP_STATUS;
    code = PayloadSchemaError.ERROR_CODE;

    /**
     * @param {string} message - A user-readable explanation of the error.
     * @param {Object} [payload={}] - The failing payload (must be sanitized upstream).
     * @param {(Object|Array)} [details={}] - Structured data detailing specific validation failures.
     */
    constructor(message, payload = {}, details = {}) {
        // Efficiency: Call super first.
        super(message);

        // Direct assignment to private fields.
        this.#failedPayload = payload;
        this.#validationDetails = details;
        
        // Stack Trace Management - done last.
        if (Error.captureStackTrace) {
            // Skips the constructor frame for a cleaner trace origin
            Error.captureStackTrace(this, PayloadSchemaError);
        }
    }

    /**
     * Public Getter: Controlled access to validation details.
     * @returns {(Object|Array)}
     */
    get validationDetails() {
        return this.#validationDetails;
    }

    /**
     * Provides a standard representation of the error suitable for JSON serialization.
     * @returns {Object} Serializable error representation.
     */
    toJSON() {
        // Efficiency: Avoids accessing private fields directly outside the class structure
        // by utilizing the public getter for validation details.
        return {
            name: this.name,
            code: this.code,
            status: this.status,
            message: this.message,
            validationDetails: this.validationDetails
        };
    }
}

module.exports = PayloadSchemaError;
