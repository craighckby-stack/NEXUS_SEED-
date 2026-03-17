/**
 * Sovereign AGI v94.1 - Custom Error: Intent Validation Failure
 * Standardizes errors resulting from non-compliance with the M-01 Intent Schema.
 *
 * Now extends BaseAgiError for standardized error handling and serialization.
 */
import { BaseAgiError } from './BaseAgiError.js';

export class IntentValidationError extends BaseAgiError {
    
    // Canonical attributes defining this specific error type
    static ERROR_NAME = 'IntentValidationError';
    static ERROR_PREFIX = '[Validation:Intent]';
    // All Intent validation errors are strictly client/input errors (400)
    static HTTP_STATUS_CODE = 400;

    /** @type {Array<Object>} Internal storage for validation details. */
    #details;

    /**
     * @param {string} message - The human-readable error description.
     * @param {Array<Object>} [validationDetails=[]] - Detailed report of validation failures (e.g., schema path, violation).
     */
    constructor(message, validationDetails = []) {
        
        super(
            `${IntentValidationError.ERROR_PREFIX} ${message}`,
            IntentValidationError.ERROR_NAME,
            IntentValidationError.HTTP_STATUS_CODE
        );

        this.#initializeDetails(validationDetails);
    }

    /**
     * Extracts the synchronous setup of internal error details.
     * @param {Array<Object>} validationDetails 
     */
    #initializeDetails(validationDetails) {
        // Encapsulate the diagnostic payload
        this.#details = validationDetails;
    }

    /**
     * Overrides the BaseAgiError serializer to include validation-specific details.
     */
    toJson() {
        return {
            ...super.toJson(),
            details: this.#details
        };
    }
}