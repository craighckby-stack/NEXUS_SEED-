/**
 * TelemetryValidator
 * Autonomous runtime service for validating event payloads against GAXEventSchema.
 * Ensures all outgoing telemetry adheres to type, format, and constraint specifications.
 */

const GAXEventSchema = require('./GAXEventSchema');

class TelemetryValidator {
    /**
     * Validates a raw event payload against its defined schema.
     * @param {string} eventName - The key name of the event (e.g., 'SYS:INIT:START').
     * @param {Object} payload - The raw data object to validate.
     * @returns {Object} { isValid: boolean, errors: Array<string> }
     */
    static validate(eventName, payload) {
        const schemaDefinition = GAXEventSchema[eventName];
        const validationResult = { isValid: true, errors: [] };

        if (!schemaDefinition) {
            validationResult.isValid = false;
            validationResult.errors.push(`Unknown event name: ${eventName}`);
            return validationResult;
        }

        const schema = schemaDefinition.schema;
        const payloadKeys = Object.keys(payload);
        const schemaKeys = Object.keys(schema);

        // 1. Check Required Fields and Type/Constraint Validation
        for (const fieldName of schemaKeys) {
            const fieldSchema = schema[fieldName];
            const fieldValue = payload[fieldName];
            const present = payload.hasOwnProperty(fieldName);

            if (fieldSchema.required && !present) {
                validationResult.isValid = false;
                validationResult.errors.push(`Missing required field: ${fieldName}`);
                continue;
            }

            if (present) {
                // Basic Type Checking
                if (typeof fieldValue !== fieldSchema.type) {
                    validationResult.isValid = false;
                    validationResult.errors.push(`Field '${fieldName}' expects type '${fieldSchema.type}', got '${typeof fieldValue}'`);
                }

                // Enum Check
                if (fieldSchema.enum && !fieldSchema.enum.includes(fieldValue)) {
                    validationResult.isValid = false;
                    validationResult.errors.push(`Field '${fieldName}' value '${fieldValue}' is not in allowed enumeration.`);
                }

                // Future: Implement 'format' (uuid, sha1) and 'pattern' logic here
                // Future: Implement 'min/max' checks
            }
        }

        // 2. Check for unexpected fields (Strict Schema Enforcement)
        for (const fieldName of payloadKeys) {
            if (!schema.hasOwnProperty(fieldName)) {
                validationResult.isValid = false;
                validationResult.errors.push(`Unexpected field encountered: ${fieldName}`);
            }
        }

        return validationResult;
    }
}

module.exports = TelemetryValidator;