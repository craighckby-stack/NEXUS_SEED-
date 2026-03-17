const fs = require('fs');
const Ajv = require('ajv'); 

const SCHEMA_PATH = './schemas/MECSchemaDefinition.json';

class MECValidationEngine {
    /**
     * Initializes the validation engine by loading and compiling the MEC schema.
     */
    constructor() {
        try {
            // Note: Relative path assumes execution context near UNIFIER.js or root
            const schemaData = fs.readFileSync(SCHEMA_PATH, 'utf8');
            this.schema = JSON.parse(schemaData);
            // Set allErrors to true to capture full diagnostics
            this.ajv = new Ajv({ allErrors: true });
            this.validate = this.ajv.compile(this.schema);
            console.log(`[MEC Validation] Schema compiled successfully.`);
        } catch (error) {
            console.error(`[MEC Validation] FATAL: Could not load or compile schema from ${SCHEMA_PATH}. Error:`, error.message);
            // Define a failsafe function if initialization fails
            this.validate = () => {
                console.warn("[MEC Validation] Engine is compromised due to schema failure; returning false.");
                return false;
            };
        }
    }

    /**
     * Validates an input data object against the MEC schema.
     * @param {object} contractData - The data instance to validate.
     * @returns {boolean} - True if validation passes, false otherwise.
     */
    validateContract(contractData) {
        const valid = this.validate(contractData);
        if (valid) {
            return true;
        } else {
            const errors = this.validate.errors ? this.validate.errors.map(e => `${e.instancePath}: ${e.message}`).join(' | ') : 'Internal Validator Error';
            console.error(`MEC Validation: FAIL. Errors: ${errors}`);
            return false;
        }
    }
}

// Export the class for UNIFIER.js integration
module.exports = MECValidationEngine;
