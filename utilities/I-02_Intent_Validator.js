/**
 * Sovereign AGI v94.1 - Intent Validator Utility (Refactored)
 * Ensures structural integrity and M-01 schema compliance for incoming Intents.
 * Utilizes specialized error types for predictable failure handling.
 */

import Ajv from 'ajv';
// Architectural Assumption: Utilize structured error type for validation failures.
import { IntentValidationError } from '../core/errors/IntentValidationError.js';
// Assumes the schema is resolvable relative to the core path structure.
import intentSchema from '../governance/M-01_Intent_Schema.json';

const ajv = new Ajv({
    allErrors: true,
    removeAdditional: true, 
    // Optimization: Coerce types (e.g., '10' -> 10) to increase robustness against API input variations.
    coerceTypes: 'array' 
});

const validateIntent = ajv.compile(intentSchema);

/**
 * Transforms verbose Ajv errors into a cleaner, actionable format.
 * @param {Array} errors - The raw Ajv error array.
 * @returns {Array<Object>} - Formatted errors.
 */
function formatErrors(errors) {
    if (!errors) return [];
    return errors.map(err => ({
        path: err.instancePath,
        keyword: err.keyword,
        message: err.message,
        schema: err.schemaPath,
        params: err.params
    }));
}

/**
 * Validates the Intent object against the M-01 schema.
 * Note: The input object is mutated if 'removeAdditional' or 'coerceTypes' are active.
 * @param {Object} intentObject - The Intent payload.
 * @returns {{valid: boolean, errors?: Array<Object>, data?: Object}} Validation result.
 */
export function validate(intentObject) {
    const valid = validateIntent(intentObject);
    
    if (!valid) {
        return {
            valid: false,
            errors: formatErrors(validateIntent.errors)
        };
    }
    
    // Return the validated object, ensuring downstream components use the cleaned data.
    return { valid: true, data: intentObject };
}

/**
 * Asserts the validity of an Intent, throwing a structured error upon failure.
 * @param {Object} intentObject - The Intent payload.
 * @returns {Object} The guaranteed compliant (potentially modified) valid Intent object.
 * @throws {IntentValidationError} If validation fails.
 */
export function assertValid(intentObject) {
    const result = validate(intentObject);

    if (!result.valid) {
        // Throw specialized error for structured error handling upstream
        throw new IntentValidationError(
            'Intent validation failed: Input does not conform to the required M-01 schema structure.',
            result.errors
        );
    }
    // Returns the intentObject which is now guaranteed schema compliant (and potentially coerced/stripped)
    return intentObject; 
}