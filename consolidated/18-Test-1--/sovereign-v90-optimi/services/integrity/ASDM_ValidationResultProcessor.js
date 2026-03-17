/**
 * services/integrity/ASDMValidationResultProcessorKernel.js V96.0 (Refactored Kernel)
 * Utility to transform raw Ajv validation errors into standardized, actionable, and machine-readable output.
 * Adopts Dependency Injection and architectural separation principles.
 */

/**
 * @typedef {object} AjvError
 * @property {string} keyword - The Ajv keyword (e.g., 'required', 'maxLength').
 * @property {string} instancePath - The JSON pointer path to the failed instance.
 * @property {string} [dataPath] - Deprecated path field (for compatibility).
 * @property {string} [message] - Ajv generated error message.
 * @property {object} params - Keyword specific parameters.
 */

/**
 * @typedef {object} StandardIssue
 * @property {string} schema - The key of the schema validated against.
 * @property {string} field - The canonical path of the invalid data (JSON Pointer format).
 * @property {string} code - The type of validation failure (Ajv keyword).
 * @property {string} message - A descriptive error message (usually the Ajv generated message).
 */

/**
 * ASDMValidationResultProcessorKernel Class.
 * Handles the processing and standardization of validation outcomes using an injected translator.
 */
export class ASDMValidationResultProcessorKernel {
    
    /** @type {import('./StructuredErrorTranslatorToolKernel').StructuredErrorTranslatorToolKernel} */
    #errorTranslator;

    /**
     * @param {import('./StructuredErrorTranslatorToolKernel').StructuredErrorTranslatorToolKernel} errorTranslator 
     * Must provide `processValidationErrors` and `createValidationResponse` methods.
     */
    constructor(errorTranslator) {
        this.#setupDependencies({ errorTranslator });
    }

    /**
     * Rigorously validates and assigns injected dependencies.
     * Satisfies the synchronous setup extraction goal.
     * @param {{errorTranslator: any}} dependencies
     * @throws {Error} if required dependencies are missing or malformed.
     */
    #setupDependencies({ errorTranslator }) {
        if (!errorTranslator || typeof errorTranslator.processValidationErrors !== 'function' || typeof errorTranslator.createValidationResponse !== 'function') {
            throw new Error("ASDMValidationResultProcessorKernel requires a valid StructuredErrorTranslatorToolKernel instance providing both processValidationErrors and createValidationResponse methods.");
        }
        this.#errorTranslator = errorTranslator;
    }

    /**
     * I/O Proxy: Delegates raw error processing to the injected translator.
     * @param {string} schemaKey 
     * @param {Array<AjvError>} rawErrors
     * @returns {Array<StandardIssue>}
     */
    #delegateToTranslatorProcessErrors(schemaKey, rawErrors) {
        return this.#errorTranslator.processValidationErrors(schemaKey, rawErrors);
    }

    /**
     * I/O Proxy: Delegates the creation of a full validation response object.
     * @param {string} schemaKey 
     * @param {{isValid: boolean, errors: Array<AjvError>|null|undefined}} validationResult
     * @returns {{success: boolean, issues: Array<StandardIssue>}}
     */
    #delegateToTranslatorCreateResponse(schemaKey, validationResult) {
        return this.#errorTranslator.createValidationResponse(schemaKey, validationResult);
    }

    /**
     * Transforms Ajv errors into a standardized, minimal failure list (StandardIssue format).
     * @param {string} schemaKey - The key of the schema validated against.
     * @param {Array<AjvError>} rawErrors - The errors array returned by Ajv.
     * @returns {Array<StandardIssue>}
     */
    processValidationErrors(schemaKey, rawErrors) {
        return this.#delegateToTranslatorProcessErrors(schemaKey, rawErrors);
    }

    /**
     * Creates a standardized validation response object based on raw Ajv output.
     * @param {string} schemaKey - The key of the schema validated against.
     * @param {{isValid: boolean, errors: Array<AjvError>|null|undefined}} validationResult
     * @returns {{success: boolean, issues: Array<StandardIssue>}}
     */
    createValidationResponse(schemaKey, validationResult) {
        return this.#delegateToTranslatorCreateResponse(schemaKey, validationResult);
    }
}