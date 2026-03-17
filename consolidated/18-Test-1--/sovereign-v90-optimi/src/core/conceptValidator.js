/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - True if the validation succeeded.
 * @property {string | null} path - The associated implementation path, if any.
 * @property {string} reason - Detailed justification for the result.
 */

/**
 * Interface for the concept ID registry.
 * @interface IConceptIdRegistryKernel
 */

/**
 * Interface for codebase file access.
 * @interface ICodebaseAccessorToolKernel
 * @property {(path: string) => Promise<boolean>} fileExistsAsync - Asynchronous file existence check.
 * @property {(path: string) => boolean} fileExists - Synchronous file existence check.
 */

/**
 * Interface for checking resource integrity (abstracting plugin logic).
 * @interface IResourceIntegrityCheckerToolKernel
 * @method check
 */

/**
 * Interface for structured validation messages.
 * @interface IConceptValidationMessagesToolKernel
 * @method INVALID_ID
 * @method DECLARATIVE
 * @method MISSING_IMPLEMENTATION
 * @method SUCCESS
 */

export class ConceptValidatorKernel {
    #conceptRegistry;
    #codebaseAccessor;
    #integrityChecker;
    #messages;

    /**
     * @param {IConceptIdRegistryKernel} conceptRegistry
     * @param {ICodebaseAccessorToolKernel} codebaseAccessor
     * @param {IResourceIntegrityCheckerToolKernel} integrityChecker
     * @param {IConceptValidationMessagesToolKernel} messages
     */
    constructor(conceptRegistry, codebaseAccessor, integrityChecker, messages) {
        this.#conceptRegistry = conceptRegistry;
        this.#codebaseAccessor = codebaseAccessor;
        this.#integrityChecker = integrityChecker;
        this.#messages = messages;
        this.#setupDependencies();
    }

    /**
     * Isolates synchronous dependency setup and validation.
     * @private
     */
    #setupDependencies() {
        if (!this.#conceptRegistry || typeof this.#conceptRegistry.hasConceptId !== 'function') {
            throw new Error("ConceptValidatorKernel requires a valid IConceptIdRegistryKernel.");
        }
        if (!this.#codebaseAccessor || typeof this.#codebaseAccessor.fileExistsAsync !== 'function') {
            throw new Error("ConceptValidatorKernel requires a valid ICodebaseAccessorToolKernel.");
        }
        if (!this.#integrityChecker || typeof this.#integrityChecker.check !== 'function') {
            throw new Error("ConceptValidatorKernel requires a valid IResourceIntegrityCheckerToolKernel.");
        }
        if (!this.#messages || typeof this.#messages.INVALID_ID !== 'function') {
            throw new Error("ConceptValidatorKernel requires a valid IConceptValidationMessagesToolKernel.");
        }
    }

    /**
     * Checks if a given concept ID exists in the registry.
     * @param {string} conceptId - The ID to validate (e.g., 'AGI-C-04').
     * @returns {boolean}
     */
    isValidConceptId(conceptId) {
        if (typeof conceptId !== 'string' || !conceptId) {
             return false;
        }
        // Use injected registry method
        return this.#conceptRegistry.hasConceptId(conceptId);
    }

    /**
     * Executes deep validation for a concept: registry existence, path definition,
     * and file existence check via the CodebaseAccessor.
     * @param {string} conceptId - The ID of the concept.
     * @returns {Promise<ValidationResult>}
     */
    async validateImplementation(conceptId) {
        const messages = this.#messages;

        if (!this.isValidConceptId(conceptId)) {
            return { 
                valid: false, 
                path: null, 
                reason: messages.INVALID_ID(conceptId) 
            };
        }

        const concept = this.#conceptRegistry.getConceptDefinition(conceptId);
        const path = concept.implementationPath;

        // Case 1: Concept is purely philosophical/declarative
        if (!path) {
            return {
                valid: true,
                path: null,
                reason: messages.DECLARATIVE(conceptId, concept.name)
            };
        }

        // Case 2: Concrete Implementation Path Defined. Check existence.
        
        // Use the injected integrity checker tool, passing required accessor methods
        const integrityCheck = await this.#integrityChecker.check({
            path,
            fileExistsAsync: this.#codebaseAccessor.fileExistsAsync.bind(this.#codebaseAccessor),
            fileExists: this.#codebaseAccessor.fileExists.bind(this.#codebaseAccessor)
        });

        if (!integrityCheck.exists) {
            return {
                valid: false,
                path,
                // Include the reason provided by the utility for better debugging
                reason: messages.MISSING_IMPLEMENTATION(path) + ` (${integrityCheck.reason})`
            };
        }

        // Case 3: Implementation verified
        return { 
            valid: true, 
            path, 
            reason: messages.SUCCESS(path) 
        };
    }
}