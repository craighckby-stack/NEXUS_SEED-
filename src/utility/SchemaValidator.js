/**
 * Sovereign AGI v95.0 - High-Integrity Schema Validator
 * Function: Provides robust, declarative validation for internal data structures 
 *           (e.g., M01 Intents, Configuration Blocks).
 */

class SchemaValidator {

    /**
     * Validates a data object against a defined schema.
     * @param {Object} data - The object to validate.
     * @param {Object} schema - The declarative schema definition.
     * @returns {{ isValid: boolean, errors: string[] }}
     */
    validate(data, schema) {
        const errors = [];

        for (const field in schema) {
            const definition = schema[field];
            const value = data[field];
            
            // 1. Presence Check
            if (definition.required && (value === undefined || value === null)) {
                errors.push(`[${field}]: Required field is missing.`);
                continue; // Cannot check type/range without a value
            }
            
            // Skip further checks if the field is optional and missing
            if (value === undefined || value === null) continue;

            // 2. Type Check (Handles Array type differentiation)
            const typeOfValue = Array.isArray(value) ? 'array' : typeof value;
            if (definition.type && typeOfValue !== definition.type) {
                errors.push(`[${field}]: Expected type '${definition.type}', got '${typeOfValue}'.`);
                continue;
            }

            // 3. Constraint/Format Checks
            
            // Check numerical constraints (min/max/integer)
            if (definition.type === 'number') {
                if (definition.min !== undefined && value < definition.min) {
                    errors.push(`[${field}]: Value ${value} is below minimum ${definition.min}.`);
                }
                if (definition.max !== undefined && value > definition.max) {
                    errors.push(`[${field}]: Value ${value} exceeds maximum ${definition.max}.`);
                }
                if (definition.integer && !Number.isInteger(value)) {
                    errors.push(`[${field}]: Value ${value} must be an integer.`);
                }
            }

            // Check string constraints (minLength, length)
            if (definition.type === 'string') {
                if (definition.minLength && value.length < definition.minLength) {
                    errors.push(`[${field}]: String length too short (min ${definition.minLength}).`);
                }
                if (definition.length && value.length !== definition.length) {
                    errors.push(`[${field}]: String length must be exactly ${definition.length}.`);
                }
            }

            // Check array constraints (minLength)
             if (definition.type === 'array') {
                if (definition.minLength && value.length < definition.minLength) {
                    errors.push(`[${field}]: Array must contain at least ${definition.minLength} elements.`);
                }
            }

            // Check enumeration constraints
            if (definition.values) {
                if (!definition.values.includes(value)) {
                     errors.push(`[${field}]: Value '${value}' is not a valid enum member.`);
                }
            }
        }

        return { isValid: errors.length === 0, errors };
    }
}

module.exports = SchemaValidator;
