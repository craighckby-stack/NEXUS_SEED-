/**
 * @fileoverview Custom error class for failures encountered during Payload Specification Engine validation.
 * Represents a structured operational failure due to invalid input schema or governance rules violation.
 * This error is designed to be safe for transmission and easy for structured logging.
 */

class PayloadSchemaError extends Error {
    // Standard HTTP status code for client payload validation errors.
    static HTTP_STATUS = 400; 
    // Internal standardized code for auditing.
    static ERROR_CODE = 'GOV_MPSE_BREACH'; 

    /**
     * @param {string} message - A user-readable explanation of the error.
     * @param {Object} [payload={}] - The full or relevant part of the input payload that caused the failure. Sensitive data should be sanitized before storing.
     * @param {(Object|Array)} [validationDetails={}] - Structured data detailing specific validation failures (e.g., Joi/Zod output, array of field errors).
     */
    constructor(message, payload = {}, validationDetails = {}) {
        super(message);

        // --- Core Error Identification ---
        this.name = 'PayloadSchemaError';
        this.isOperational = true; // Essential flag for operational error handling middleware

        // --- Contextual Data & Governance ---
        this.status = PayloadSchemaError.HTTP_STATUS;
        this.code = PayloadSchemaError.ERROR_CODE;

        this.failedPayload = payload;
        this.validationDetails = validationDetails; 

        // --- Stack Trace Management ---
        if (Error.captureStackTrace) {
            // Skips the constructor frame for a cleaner trace origin
            Error.captureStackTrace(this, PayloadSchemaError); 
        }
    }

    /**
     * Provides a standard representation of the error suitable for JSON serialization (e.g., API response bodies or structured logs).
     * Deliberately excludes the full 'failedPayload' and raw stack trace for security and conciseness in external serialization.
     * @returns {Object} Serializable error representation.
     */
    toJSON() {
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
