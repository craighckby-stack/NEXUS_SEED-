const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv').default;

// Simple internal logger structure mimicking Python logging behavior
const logger = {
    debug: (...args) => console.debug(`[CHR_VALIDATOR] DEBUG:`, ...args),
    info: (...args) => console.info(`[CHR_VALIDATOR] INFO:`, ...args),
    warning: (...args) => console.warn(`[CHR_VALIDATOR] WARNING:`, ...args),
    error: (...args) => console.error(`[CHR_VALIDATOR] ERROR:`, ...args),
    critical: (...args) => console.error(`[CHR_VALIDATOR] CRITICAL:`, ...args),
};

class ChronologyValidator {
    /**
     * Utility class for validating Chronology Records (CHR) against the formal protocol schema.
     * Ensures data integrity across the Sovereign AGI system\'s runtime history layer.
     */

    // Use a class-level constant for the default path
    static DEFAULT_SCHEMA_PATH = path.join("protocol", "chr_schema.json");

    /**
     * Static factory method to initialize the validator asynchronously.
     * @param {string | object | null} schemaSource - Optional path string, or pre-loaded schema object.
     * @returns {Promise<ChronologyValidator>}
     */
    static async create(schemaSource = null) {
        const validator = new ChronologyValidator();
        await validator._initialize(schemaSource);
        return validator;
    }

    constructor() {
        // Configure AJV for detailed error reporting
        this.ajv = new Ajv({ allErrors: true, strict: true });
        this.validate = null; // Will hold the compiled validation function
    }

    async _initialize(schemaSource) {
        let schema;

        if (typeof schemaSource === 'object' && schemaSource !== null && !Array.isArray(schemaSource)) {
            // Schema provided directly
            schema = schemaSource;
            logger.debug("ChronologyValidator initialized with in-memory schema.");
        } else {
            // Load from file (string path or default)
            const schemaFilePath = schemaSource ? path.resolve(schemaSource) : path.resolve(ChronologyValidator.DEFAULT_SCHEMA_PATH);
            
            try {
                // Check if file exists and read content
                const content = await fs.readFile(schemaFilePath, 'utf-8');
                schema = JSON.parse(content);
                logger.info(`ChronologyValidator initialized successfully using schema: ${schemaFilePath}`);
            } catch (e) {
                if (e.code === 'ENOENT') {
                    const errorMsg = `Required CHR schema file not found at ${schemaFilePath}`;
                    logger.critical(errorMsg);
                    throw new Error(errorMsg);
                } else if (e instanceof SyntaxError) {
                    const errorMsg = `Failed to parse valid JSON schema at ${schemaFilePath}: ${e.message}`;
                    logger.critical(errorMsg);
                    throw new Error(errorMsg);
                } else {
                    throw e;
                }
            }
        }
        
        // Compile the schema using AJV
        try {
            this.validate = this.ajv.compile(schema);
        } catch (e) {
             const errorMsg = `Failed to compile schema: ${e.message}`;
             logger.critical(errorMsg);
             throw new Error(errorMsg);
        }
    }
    
    /**
     * Validates a single Chronology Record against the schema.
     * @param {object} record - The record to validate.
     * @returns {[boolean, string | null]} - [success, error_message]
     */
    validateRecord(record) {
        if (typeof record !== 'object' || record === null || Array.isArray(record)) {
            const msg = `Validation skipped: Input is not a plain object (${typeof record}) starting with ${String(record).substring(0, 50)}`;
            logger.warning(msg);
            return [false, msg];
        }

        if (!this.validate) {
            const msg = "Validator not initialized. Schema compilation failed or was skipped.";
            logger.error(msg);
            return [false, msg];
        }

        const success = this.validate(record);

        if (success) {
            return [true, null];
        } else {
            // AJV stores errors in validator.errors
            const errors = this.validate.errors;
            
            // Extract relevant error information from the first error
            const firstError = errors[0];
            
            const recordId = record.uuid || record.timestamp || 'UNKNOWN_ID';
            
            // AJV uses instancePath for the field path
            const fieldPath = firstError.instancePath || '';
            const errorMessage = firstError.message;

            const fullErrorMsg = (
                `[CHR Protocol Breach] Validation failed on record \'${recordId}\'. ` +
                `Error: ${errorMessage}. Field Path: ${fieldPath}`
            );
            
            logger.error(fullErrorMsg);
            return [false, fullErrorMsg];
        }
    }
}

module.exports = ChronologyValidator;