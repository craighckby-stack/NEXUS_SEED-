/**
 * @fileoverview Custom error class for failures encountered during Payload Specification Engine validation.
 * Represents a structured operational failure due to invalid input schema or governance rules violation.
 * This error enforces the mandatory high-integrity error structure, including a specific conceptId,
 * required by the AIA Enforcement Layer for auditable error processing and normalization.
 *
 * NOTE: Canonical serialization (safe field exclusion, deep filtering) is delegated to the
 * IErrorDetailNormalizationToolKernel during pipeline processing, eliminating the need for internal
 * synchronous utility usage (CanonicalErrorFormatterUtility).
 */

class PayloadSchemaError extends Error {
    // Standard HTTP status code for client payload validation errors.
    static HTTP_STATUS = 400;
    
    // Mandatory, standardized concept identifier for high-integrity audit (AIA Enforcement Layer).
    static CONCEPT_ID = 'GOV_E_003'; 

    /** @type {boolean} */
    public isOperational;
    /** @type {number} */
    public status;
    /** @type {string} */
    public conceptId;
    /** @type {Object} */
    public failedPayload;
    /** @type {(Object|Array)} */
    public validationDetails;

    /**
     * @param {string} message - A user-readable explanation of the error.
     * @param {Object} [payload={}] - The full or relevant part of the input payload that caused the failure. Sensitive data must be sanitized before storing.
     * @param {(Object|Array)} [validationDetails={}] - Structured data detailing specific validation failures (e.g., Joi/Zod output, array of field errors).
     */
    constructor(message, payload = {}, validationDetails = {}) {
        super(message);

        // --- Core Error Identification ---
        this.name = 'PayloadSchemaError';
        this.isOperational = true; // Essential flag for operational error handling middleware

        // --- Contextual Data & Governance ---
        this.status = PayloadSchemaError.HTTP_STATUS;
        this.conceptId = PayloadSchemaError.CONCEPT_ID;

        this.failedPayload = payload;
        this.validationDetails = validationDetails; 

        // --- Stack Trace Management ---
        if (Error.captureStackTrace) {
            // Skips the constructor frame for a cleaner trace origin
            Error.captureStackTrace(this, PayloadSchemaError); 
        }
    }

    /**
     * Provides a basic representation of the error suitable for native JSON serialization (JSON.stringify).
     * Full, canonical normalization and security filtering is handled asynchronously by the
     * IErrorDetailNormalizationToolKernel in the processing pipeline.
     * @returns {Object} Serializable error representation.
     */
    toJSON() {
        return {
            name: this.name,
            conceptId: this.conceptId,
            status: this.status,
            message: this.message,
            validationDetails: this.validationDetails
            // failedPayload is intentionally omitted here; the normalization tool handles inclusion/exclusion safely.
        };
    }
}

module.exports = PayloadSchemaError;