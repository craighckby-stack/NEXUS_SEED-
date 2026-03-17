/**
 * ASDMErrorTranslatorKernel V1.0
 * Component responsible for converting standardized internal validation issues (StandardIssue)
 * into finalized, human-readable error messages by delegating to a StructuredErrorTranslator tool.
 */

/**
 * @typedef {object} StandardIssue
 * @property {string} schema - The key of the schema validated against.
 * @property {string} field - The canonical path of the invalid data (JSON Pointer format).
 * @property {string} code - The type of validation failure (Ajv keyword or custom code).
 * @property {string} message - The original generated error message (used as fallback).
 */

export class ASDMErrorTranslatorKernel {
    #translator;
    #isInitialized = false;

    /**
     * @param {object} structuredErrorTranslator - The tool implementing the `translate(issue, locale)` interface.
     */
    constructor(structuredErrorTranslator) {
        this.#translator = structuredErrorTranslator;
        this.#setupDependencies();
        this.#isInitialized = true;
    }

    /**
     * Extracts synchronous dependency validation and configuration.
     * Ensures the translation tool is present and usable.
     * @private
     */
    #setupDependencies() {
        if (!this.#translator || typeof this.#translator.translate !== 'function') {
            this.#throwSetupError("Missing or invalid StructuredErrorTranslator dependency. Must provide a 'translate' function.");
        }
    }

    /**
     * Throws a critical error during initialization.
     * @param {string} message
     * @private
     */
    #throwSetupError(message) {
        console.error(`ASDMErrorTranslatorKernel Setup Error: ${message}`);
        throw new Error(`ASDMErrorTranslatorKernel Initialization Failure: ${message}`);
    }

    /**
     * Private I/O proxy for delegating the translation call to the internal tool.
     * Wraps the call in error handling for robustness.
     * @param {StandardIssue} issue 
     * @param {string} locale
     * @returns {string} The translated message.
     * @private
     */
    #delegateToTranslatorTranslate(issue, locale) {
        try {
            // Delegation to the injected tool
            return this.#translator.translate(issue, locale);
        } catch (error) {
            // Log failure and return a safe fallback message
            console.warn(`Translation delegation failed for issue code ${issue.code} on field ${issue.field}: ${error.message}`);
            return `Validation failure occurred on field ${issue.field} (Code: ${issue.code}). Contact system administrator (Locale: ${locale}).`;
        }
    }

    /**
     * Takes a standardized issue and formats a highly contextual message.
     * 
     * @param {StandardIssue} issue 
     * @param {string} [locale='en-US'] - Optional locale setting.
     * @returns {string} The final, user-ready error message.
     */
    translateIssueToUserMessage(issue, locale = 'en-US') {
        if (!this.#isInitialized) {
             throw new Error("ASDMErrorTranslatorKernel must be initialized before use.");
        }
        if (!issue) {
            return "Received empty validation issue.";
        }
        
        return this.#delegateToTranslatorTranslate(issue, locale);
    }

    /**
     * Public alias for the core translation logic.
     * @param {StandardIssue} issue 
     * @param {string} [locale='en-US']
     * @returns {string}
     */
    translate(issue, locale = 'en-US') {
        return this.translateIssueToUserMessage(issue, locale);
    }
}