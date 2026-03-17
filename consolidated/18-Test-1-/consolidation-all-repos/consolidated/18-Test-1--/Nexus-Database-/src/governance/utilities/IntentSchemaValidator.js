/**
 * Utility: Intent Schema Validator
 * ID: GU-ISV-v94.1R
 * Mandate: Provides API for validating incoming Mutation Intent Packages (M-XX) against
 * the central IntentSchemas registry and extracting necessary security configurations.
 * Fulfills the explicit requirement for 'strict compliance checks' by enforcing structural
 * integrity and defining expectations for content validation mechanisms.
 */

const IntentSchemas = require('../config/intentSchemas');
// const IntentPayloadValidator = require('./IntentPayloadValidator'); // Dependency proposed for deep content validation

class IntentSchemaValidator {

    /**
     * @typedef {object} ValidationResult
     * @property {boolean} isValid - True if validation passed.
     * @property {Array<{code: string, message: string, detail: any}>} [errors] - List of specific validation errors.
     * @property {object|null} [schema] - The schema used for validation, if found.
     */

    /**
     * Retrieves the complete schema definition for a given intent ID.
     * @param {string} intentId - e.g., 'M01', 'M02'
     * @returns {object|null} The schema definition or null if not found.
     */
    static getSchema(intentId) {
        if (typeof intentId !== 'string' || intentId.length === 0) {
            return null;
        }
        return IntentSchemas[intentId] || null;
    }

    /**
     * Performs comprehensive validation on a raw incoming intent package structure and content header.
     *
     * @param {object} pkg - The raw intent package to validate.
     * @returns {ValidationResult} Detailed validation result.
     */
    static validateIntentPackage(pkg) {
        const result = {
            isValid: true,
            errors: []
        };

        // 1. Basic Structure Check
        if (!pkg || typeof pkg !== 'object') {
            result.errors.push({ code: 'E_INV_PK_01', message: "Package is missing or not an object." });
            result.isValid = false;
            return result;
        }
        if (!pkg.intentId || typeof pkg.intentId !== 'string') {
            result.errors.push({ code: 'E_INV_PK_02', message: "Intent ID (intentId) is missing or invalid." });
            result.isValid = false;
            // Cannot proceed without intentId
            return result;
        }

        // 2. Schema Existence Check
        const schema = this.getSchema(pkg.intentId);
        result.schema = schema;

        if (!schema) {
            result.errors.push({ code: 'E_INV_SCH_01', message: `Unknown intent ID '${pkg.intentId}'. Validation halted.` });
            result.isValid = false;
            return result;
        }

        // 3. Type Coherence Check
        if (!pkg.intentType || pkg.intentType !== schema.type) {
            result.errors.push({ 
                code: 'E_INV_TYP_01', 
                message: `Intent type mismatch for ${pkg.intentId}.`,
                detail: { expected: schema.type, received: pkg.intentType }
            });
            result.isValid = false;
        }

        // NOTE: Deep payload validation (against schema.payloadSchema) should be handled by a dedicated utility (e.g., IntentPayloadValidator).
        
        return result;
    }

    /**
     * Extracts required security parameters for execution flow logic.
     * @param {string} intentId 
     * @returns {object|null} Security configuration object
     */
    static getSecurityConfig(intentId) {
        const schema = this.getSchema(intentId);
        return (schema && schema.security) ? schema.security : null;
    }

    /**
     * Extracts the required payload schema definition (if one exists).
     * This definition is necessary for deep content validation.
     * @param {string} intentId 
     * @returns {object|null} JSON Schema definition for the payload.
     */
    static getPayloadSchema(intentId) {
        const schema = this.getSchema(intentId);
        return (schema && schema.payloadSchema) ? schema.payloadSchema : null;
    }
}

module.exports = IntentSchemaValidator;
