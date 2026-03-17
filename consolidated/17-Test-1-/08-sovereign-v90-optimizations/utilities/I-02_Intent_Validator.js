/**
 * Sovereign AGI v94.1 - Intent Validator Utility (Refactored)
 * Ensures structural integrity and M-01 schema compliance for incoming Intents.
 * Utilizes specialized error types for predictable failure handling.
 *
 * Note: Direct Ajv instantiation is replaced by abstraction via SchemaCompilerAndValidator plugin.
 */

import { IntentValidationError } from '../core/errors/IntentValidationError.js';
import intentSchema from '../governance/M-01_Intent_Schema.json';

// Assumed imports from kernel plugin system
import { SchemaCompilerAndValidator } from '@plugins/SchemaCompilerAndValidator';
import { SchemaErrorFormatterTool } from '@plugins/SchemaErrorFormatterTool';

// Configuration specific to Intent validation, aligned with Ajv options
const INTENT_VALIDATOR_CONFIG = {
    allErrors: true,
    removeAdditional: true, 
    // Optimization: Coerce types (e.g., '10' -> 10) to increase robustness against API input variations.
    coerceTypes: 'array' 
};

// Use the service to compile the schema with the desired configuration
// The service abstracts the underlying validator (e.g., Ajv) dependency.
const validateIntent = SchemaCompilerAndValidator.compile(intentSchema, INTENT_VALIDATOR_CONFIG);

/**
 * Validates the Intent object against the M-01 schema.
 * Note: The input object is mutated if 'removeAdditional' or 'coerceTypes' are active by the validator implementation.
 * @param {object} intentObject - The Intent payload.
 * @returns {{valid: boolean, errors?: Array<object>, data?: object}} Validation result.
 */
export function validate(intentObject: object): { valid: boolean; errors?: Array<object>; data?: object } {
    // The compiled validator function executes the validation.
    const valid = validateIntent(intentObject); 
    
    if (!valid) {
        // Use the extracted tool to format errors
        const formattedErrors = SchemaErrorFormatterTool.execute({
            errors: validateIntent.errors
        });

        return {
            valid: false,
            errors: formattedErrors
        };
    }
    
    // Return the validated object, ensuring downstream components use the cleaned data.
    return { valid: true, data: intentObject };
}

/**
 * Asserts the validity of an Intent, throwing a structured error upon failure.
 * @param {object} intentObject - The Intent payload.
 * @returns {object} The guaranteed compliant (potentially modified) valid Intent object.
 * @throws {IntentValidationError} If validation fails.
 */
export function assertValid(intentObject: object): object {
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