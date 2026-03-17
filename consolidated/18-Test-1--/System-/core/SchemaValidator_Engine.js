// core/SchemaValidator_Engine.js
import { XEL_Specification } from '../config/XEL_Specification.json';
import Ajv from 'ajv'; 

/**
 * Custom error class for structured, machine-readable validation failures.
 */
class SchemaValidationError extends Error {
    constructor(schemaName, errors) {
        // Generate detailed error text using Ajv's utility
        const errorText = Ajv.prototype.errorsText(errors, { separator: '; ', dataVar: schemaName });
        super(`XEL Validation Failed [${schemaName}]: ${errorText}`);
        this.name = 'SchemaValidationError';
        this.schemaName = schemaName;
        this.validationErrors = errors; // Raw Ajv errors for programmatic handling
    }
}

/**
 * The Schema Validator enforces the structural integrity of data across the XEL environment,
 * ensuring all messages and internal objects adhere to the specifications defined in XEL_Specification.json.
 */
class SchemaValidatorEngine {
    constructor() {
        // Configuration for maximum robustness and data hygiene:
        // - allErrors: Collects all issues.
        // - strict: Ensures the schemas themselves are valid.
        // - removeAdditional: Strips extraneous properties, ensuring cleaner data flow.
        this.validator = new Ajv({
            schemas: XEL_Specification.ComponentSchemas,
            allErrors: true,
            strict: true,
            removeAdditional: 'all' 
        });
        this.SchemaValidationError = SchemaValidationError;
    }

    /**
     * Validates an object against a specific XEL component schema.
     * @param {string} schemaName - The key in ComponentSchemas (e.g., 'TaskRequest').
     * @param {object} data - The object to validate (will be modified if removeAdditional is active).
     * @throws {SchemaValidationError} If validation fails.
     */
    validate(schemaName, data) {
        const validateFn = this.validator.getSchema(schemaName);
        
        if (!validateFn) {
            // Use standard Error for configuration failure, not data validation failure
            throw new Error(`Configuration Error: Schema '${schemaName}' not registered.`);
        }
        
        const valid = validateFn(data); // Data is potentially mutated here (clean up)
        
        if (!valid) {
            throw new this.SchemaValidationError(schemaName, validateFn.errors);
        }
        
        // Return the validated and cleaned data structure
        return data;
    }
    
    /**
     * Returns the custom structured error class for external use/catching.
     * @returns {SchemaValidationError}
     */
    getValidationErrorClass() {
        return this.SchemaValidationError;
    }
}

export { SchemaValidatorEngine, SchemaValidationError };
export default new SchemaValidatorEngine();
