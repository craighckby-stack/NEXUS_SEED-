/**
 * Sovereign AGI v94.1 - Custom Error: Intent Validation Failure
 * Standardizes errors resulting from non-compliance with the M-01 Intent Schema.
 * 
 * Now extends BaseAgiError for standardized error handling and serialization.
 */
import { BaseAgiError } from './BaseAgiError.js';

export class IntentValidationError extends BaseAgiError {
    /**
     * @param {string} message - The human-readable error description.
     * @param {Array<Object>} [validationDetails=[]] - Detailed report of validation failures (e.g., schema path, violation).
     */
    constructor(message, validationDetails = []) {
        const name = 'IntentValidationError';
        // Standard prefix for quick identification in monitoring systems
        const prefix = '[Validation:Intent]'; 
        
        // All Intent validation errors are strictly client/input errors (400)
        super(`${prefix} ${message}`, name, 400);

        /** @type {Array<Object>} */
        this.details = validationDetails;
    }

    /**
     * Overrides the BaseAgiError serializer to include validation-specific details.
     */
    toJson() {
        return {
            ...super.toJson(),
            details: this.details
        };
    }
}