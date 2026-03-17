/**
 * SchemaConstraintUtility - Handles specialized field validations derived from artifact schema constraints.
 * E.g., validating hash format, timestamp structure, or specific field enumerations.
 */
class SchemaConstraintUtility {

    /**
     * Validates a specific field value against its schema constraints.
     * @param {string} fieldName The name of the field being validated.
     * @param {*} value The actual data value from the artifact payload.
     * @param {object} constraints The schema rules for this field (type, format, minimum, etc.).
     * @throws {Error} If the value fails to meet the specified constraints.
     */
    validateField(fieldName, value, constraints) {
        const valueType = typeof value;

        // 1. Basic Type Check (Mandatory constraint.type)
        if (constraints.type) {
            if (constraints.type === 'string' && valueType !== 'string') {
                throw new Error(`Field ${fieldName} expected type ${constraints.type}, got ${valueType}`);
            }
            if (constraints.type === 'number' && (valueType !== 'number' || isNaN(value))) {
                 throw new Error(`Field ${fieldName} expected type ${constraints.type}, got ${valueType}`);
            }
            // Extend with boolean, array, object checks...
        }

        // 2. Specialized Format Check (Handling defined formats like HASH_SHA256)
        if (constraints.format) {
            switch (constraints.format) {
                case 'HASH_SHA256':
                    if (!/^[a-f0-9]{64}$/i.test(value)) {
                        throw new Error(`Field ${fieldName} must be a valid SHA256 hash.`);
                    }
                    break;
                case 'TIMESTAMP_ISO8601':
                    // Use robust check for ISO 8601 date string
                    if (isNaN(Date.parse(value))) {
                        throw new Error(`Field ${fieldName} must be a valid ISO8601 timestamp.`);
                    }
                    break;
                // Add support for further formats (e.g., UUID, URL, Public Key format)
            }
        }

        // 3. Additional Constraint Checks (e.g., enumeration, min/max length, range)
        if (constraints.enum && !constraints.enum.includes(value)) {
             throw new Error(`Field ${fieldName} value not allowed. Must be one of: ${constraints.enum.join(', ')}.`);
        }

        return true;
    }
}

module.exports = SchemaConstraintUtility;