const HALT_LOG_SCHEMA = Object.freeze({
    $id: 'IntegrityHaltLog',
    type: 'object',
    required: ['timestamp', 'reasonCode', 'details', 'attestationSource', 'signatureHash'],
    properties: {
        timestamp: {
            type: 'number',
            description: 'Unix timestamp in milliseconds.',
            minimum: 1600000000000
        },
        reasonCode: {
            type: 'string',
            description: 'Specific code identifying the halt cause.',
            pattern: '^[A-Z0-9_]{3,64}$'
        },
        details: {
            type: 'object',
            required: ['message', 'stackHash'],
            properties: {
                message: { type: 'string' },
                stackHash: { type: 'string', pattern: '^[0-9a-fA-F]{64}$' }
            }
        },
        attestationSource: {
            type: 'string',
            enum: ['KERNEL', 'HW_WATCHDOG', 'SEC_MODULE', 'TRUSTED_ENV']
        },
        signatureHash: {
             type: 'string',
             pattern: '^[0-9a-fA-F]{128}$',
             description: 'Cryptographic hash of the log content for signing pre-check.'
        }
    },
    additionalProperties: false
});

/**
 * IntegrityHaltValidator: Ensures critical halt logs conform strictly
 * to the defined integrity schema before signing/finalizing.
 * 
 * Optimization: Uses explicit Dependency Injection and private fields
 * to replace reliance on global scope access for the core validator utility.
 */
class IntegrityHaltValidator {
    
    #validator;
    #schema;
    #schemaId;

    /**
     * @param {object} validator An instance of the StrictSchemaValidator utility.
     *                          Must implement a validate(payload, schema, schemaId) method.
     */
    constructor(validator) {
        this.#setupDependencies(validator);
        this.#initializeConfiguration();
    }

    /**
     * Handles dependency validation and assignment.
     */
    #setupDependencies(validator) {
        if (!validator || typeof validator.validate !== 'function') {
            throw new Error('Dependency Error: A valid StrictSchemaValidator instance is required.');
        }
        this.#validator = validator;
    }

    /**
     * Handles synchronous configuration setup.
     */
    #initializeConfiguration() {
        this.#schema = HALT_LOG_SCHEMA;
        this.#schemaId = this.#schema.$id;
    }

    /**
     * Validates a critical halt log entry, delegating the operation to the
     * injected, strictly encapsulated validator utility.
     * @param {object} logEntry The log entry object to validate.
     * @returns {boolean} True if validation passes.
     */
    validate(logEntry) {
        return this.#delegateToValidatorValidation(logEntry);
    }

    /**
     * Isolates interaction with the external StrictSchemaValidator dependency.
     * @param {object} logEntry The log entry object to validate.
     */
    #delegateToValidatorValidation(logEntry) {
        // Delegation to the abstracted strict validation logic
        return this.#validator.validate(logEntry, this.#schema, this.#schemaId);
    }

    /**
     * Retrieves the current validation schema.
     * @returns {object}
     */
    static getSchema() {
        return HALT_LOG_SCHEMA;
    }
}

module.exports = IntegrityHaltValidator;