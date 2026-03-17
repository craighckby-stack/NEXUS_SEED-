import { PolicyIntegrityError } from '../errors/policyErrors.js';

/**
 * @interface ISpecValidatorKernel
 * Defines the required interface for validating data against a specification.
 * The implementation must be pre-configured with the Policy Governance Schema.
 */

class PolicySchemaValidatorKernel {
    /**
     * @type {ISpecValidatorKernel}
     */
    #specValidator;

    /**
     * Initializes the kernel by injecting a pre-configured specification validator.
     * The injected validator MUST be pre-configured with the governance schema.
     * @param {ISpecValidatorKernel} specValidator - The pre-configured specification validation kernel.
     */
    constructor(specValidator) {
        this.#specValidator = specValidator;
        this.#setupDependencies();
    }

    /**
     * Rigorously validates and initializes all required dependencies.
     * Synchronous setup logic is isolated here.
     * @private
     */
    #setupDependencies() {
        if (!this.#specValidator || typeof this.#specValidator.validate !== 'function') {
            throw new Error("[PSK-DEP] PolicySchemaValidatorKernel requires a valid ISpecValidatorKernel dependency with a 'validate' method.");
        }
    }

    /**
     * Delegates the validation execution to the injected Spec Validator.
     * @private
     * @param {object} policyConfigData
     * @returns {{isValid: boolean, errors: Array<object>}}
     */
    #delegateToValidatorValidate(policyConfigData) {
        // Assuming ISpecValidatorKernel.validate returns { isValid, errors }
        return this.#specValidator.validate(policyConfigData);
    }

    /**
     * Logs the validation failure details using system console.
     * @private
     * @param {Array<object>} errors 
     * @param {string} schemaIdentifier 
     */
    #logValidationFailure(errors, schemaIdentifier) {
        const errorList = errors || [];
        
        // Generate robust error details utilizing AJV fields
        const errorDetails = errorList.map(e => {
            const dataPath = e.instancePath || e.dataPath || 'root';
            const schemaPath = e.schemaPath || 'unknown';
            return `[Path: ${dataPath}] ${e.message}. Schema Ref: ${schemaPath} (Keyword: ${e.keyword})`;
        }).join('\n');
        
        // Note: Using console.error is considered a proxy for system logging.
        console.error(`[CSV-01] Policy Validation Failed against schema ${schemaIdentifier}. Errors: ${errorList.length}. Details:\n${errorDetails}`);
    }

    /**
     * Throws a PolicyIntegrityError.
     * @private
     * @param {number} errorCount 
     * @param {Array<object>} errorList 
     */
    #throwIntegrityError(errorCount, errorList) {
         throw new PolicyIntegrityError(
            `Policy configuration failed strict compliance schema validation. Found ${errorCount} structural issues.`, 
            errorList 
        );
    }

    /**
     * Validates the provided policy configuration data against the governance schema.
     * @param {object} policyConfigData - The configuration object (e.g., from the Policy Engine, C-15).
     * @returns {true} If validation passes.
     * @throws {PolicyIntegrityError} If validation fails.
     */
    validate(policyConfigData) {
        const { isValid, errors } = this.#delegateToValidatorValidate(policyConfigData);
        
        if (!isValid) {
            const errorList = errors || [];
            // Assuming the injected ISpecValidatorKernel provides a property
            // to identify the specification it is using.
            const schemaIdentifier = this.#specValidator.schemaSourceIdentifier || 'Unknown Policy Schema'; 
            
            this.#logValidationFailure(errorList, schemaIdentifier);
            this.#throwIntegrityError(errorList.length, errorList);
        }
        return true;
    }
}

export default PolicySchemaValidatorKernel;