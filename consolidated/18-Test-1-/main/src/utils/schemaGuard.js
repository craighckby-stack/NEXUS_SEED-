/**
 * Schema Guard Utility (Sovereign AGI v94.1)
 * Provides structural and advanced type validation for complex configuration objects and arrays.
 * This utility handles constraints beyond simple scalar validation (handled by configValidator).
 * Uses a lightweight schema definition approach.
 */

/**
 * Defines accepted structure types for schema checking.
 * 'number', 'string', 'boolean', 'array', 'object', 'any'
 */

const SchemaGuard = {

    /**
     * Executes structural validation against a predefined schema.
     * @param {object} data The object to validate.
     * @param {object} schema The validation schema definition.
     * @returns {Array<string>} An array of validation errors. Empty array means valid.
     */
    validate(data, schema) {
        const errors = [];

        for (const key in schema) {
            const constraint = schema[key];
            const value = data[key];
            const path = key;

            // Presence Check
            if (constraint.required && (value === undefined || value === null)) {
                errors.push(`[${path}] Missing required property.`);
                continue;
            }
            
            // If not required and not present, skip further checks
            if (value === undefined || value === null) continue;

            // Type Check
            if (constraint.type && constraint.type !== 'any') {
                const expectedType = constraint.type === 'array' ? 'object' : constraint.type;
                const receivedType = Array.isArray(value) ? 'array' : typeof value;

                if (receivedType !== expectedType) {
                    errors.push(`[${path}] Expected type '${constraint.type}', got '${receivedType}'.`);
                }
            }
            
            // Recursive structure check for objects and arrays
            if (constraint.schema && typeof value === 'object') {
                if (Array.isArray(value) && constraint.type === 'array') {
                    // Array item validation
                    value.forEach((item, index) => {
                        const itemErrors = SchemaGuard.validate(item, constraint.schema);
                        itemErrors.forEach(err => errors.push(`[${path}.${index}] ${err}`));
                    });
                } else if (!Array.isArray(value) && constraint.type === 'object') {
                    // Object structure validation
                    const nestedErrors = SchemaGuard.validate(value, constraint.schema);
                    nestedErrors.forEach(err => errors.push(`[${path}] ${err}`));
                }
            }
        }

        return errors;
    }
};

module.exports = SchemaGuard;
