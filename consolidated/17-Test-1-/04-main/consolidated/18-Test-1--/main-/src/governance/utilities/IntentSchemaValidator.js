/**
 * Utility: Intent Schema Validator
 * ID: GU-ISV-v94.1
 * Mandate: Provides API for validating incoming Mutation Intent Packages (M-XX) against
 * the central IntentSchemas registry and extracting necessary security configurations,
 * fulfilling the explicit requirement for 'strict compliance checks'.
 */

const IntentSchemas = require('../config/intentSchemas');

class IntentSchemaValidator {

    /**
     * Retrieves the complete schema definition for a given intent ID.
     * @param {string} intentId - e.g., 'M01', 'M02'
     * @returns {object|null} The schema definition or null if not found.
     */
    static getSchema(intentId) {
        return IntentSchemas[intentId] || null;
    }

    /**
     * Performs compliance validation on a raw incoming intent package structure.
     * @param {object} pkg - The raw intent package to validate. Must contain intentId and intentType.
     * @returns {boolean} True if structurally valid according to schema definition.
     */
    static validatePackageStructure(pkg) {
        if (!pkg || typeof pkg !== 'object' || !pkg.intentId || !pkg.intentType) {
            console.error("Validation Failed: Missing core intent package structure (intentId, intentType).", pkg);
            return false;
        }

        const schema = this.getSchema(pkg.intentId);

        if (!schema) {
            console.error(`Validation Failed: Unknown intent ID '${pkg.intentId}'.`);
            return false;
        }

        if (pkg.intentType !== schema.type) {
            console.error(`Validation Failed: Intent type mismatch for ${pkg.intentId}. Expected: ${schema.type}, Received: ${pkg.intentType}`);
            return false;
        }
        
        // NOTE: Further payload content validation logic (e.g., against JSON schema) would integrate here.
        
        return true;
    }

    /**
     * Extracts required security parameters for execution flow logic.
     * @param {string} intentId 
     * @returns {object|null} Security configuration object
     */
    static getSecurityConfig(intentId) {
        const schema = this.getSchema(intentId);
        return schema ? schema.security : null;
    }
}

module.exports = IntentSchemaValidator;
