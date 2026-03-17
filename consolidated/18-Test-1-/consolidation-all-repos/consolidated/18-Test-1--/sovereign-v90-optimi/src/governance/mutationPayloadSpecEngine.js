/**
 * AGI-KERNEL v7.11.3
 * High-integrity, asynchronous Mutation Payload Specification Kernel.
 * Replaces the synchronous MutationPayloadSpecEngine utility.
 * Enforces non-blocking execution, maximal recursive abstraction, and auditable control flow.
 */
class MutationPayloadSpecKernel {
    #payloadSchemaRegistry; // PayloadSchemaRegistryKernel
    #specValidatorKernel;   // ISpecValidatorKernel
    #logger; // ILoggerToolKernel (inferred necessity)
    #initialized = false;

    /**
     * @param {PayloadSchemaRegistryKernel} payloadSchemaRegistry 
     * @param {ISpecValidatorKernel} specValidatorKernel 
     * @param {Object} logger
     */
    constructor(payloadSchemaRegistry, specValidatorKernel, logger) {
        if (!payloadSchemaRegistry || !specValidatorKernel || !logger) {
            throw new Error("MutationPayloadSpecKernel requires all dependency kernels: Registry, Validator, and Logger.");
        }
        this.#payloadSchemaRegistry = payloadSchemaRegistry;
        this.#specValidatorKernel = specValidatorKernel;
        this.#logger = logger;
    }

    /**
     * Asynchronously initializes the kernel, ensuring all dependencies are ready.
     */
    async initialize() {
        if (this.#initialized) return;
        this.#logger.info('Initializing MutationPayloadSpecKernel...');
        // Dependencies are initialized externally, kernel only verifies availability.
        this.#initialized = true;
    }

    /**
     * Resolves the required schema specification for a given mutation type and validates 
     * the provided payload against it asynchronously.
     * 
     * This process delegates the heavy lifting of schema retrieval and validation to 
     * specialized Tool Kernels, adhering to the principle of maximal recursive abstraction.
     * 
     * @param {string} mutationType The conceptual identifier of the mutation.
     * @param {object} payload The data payload to validate.
     * @returns {Promise<Readonly<{isValid: boolean, errors: ReadonlyArray<any>}>>} 
     * @throws {Error|Readonly<{isValid: boolean, errors: ReadonlyArray<any>, mutationType: string}>} Throws on invalid payload or missing spec.
     */
    async resolveAndValidate(mutationType, payload) {
        if (!this.#initialized) {
            throw new Error('Kernel not initialized. Call initialize() first.');
        }

        this.#logger.trace(`Attempting to validate payload for mutation type: ${mutationType}`);

        // 1. Resolve the Specification (Schema) using the Registry Kernel
        const specSchema = await this.#payloadSchemaRegistry.getSchema(mutationType);

        if (!specSchema) {
            this.#logger.error(`CRITICAL: Missing required mutation specification for type: ${mutationType}`);
            // Must fail if the specification is not defined, as per high-integrity mandate.
            throw new Error(`CRITICAL: Missing required mutation specification for type: ${mutationType}`);
        }

        // 2. Validate the Payload against the Specification using the Validator Kernel
        const validationResult = await this.#specValidatorKernel.validate(specSchema, payload);

        if (validationResult.isValid) {
            this.#logger.debug(`Payload successfully validated against spec for ${mutationType}.`);
            return Object.freeze({ isValid: true, errors: Object.freeze([]) });
        } else {
            this.#logger.warn(`Validation failed for mutation ${mutationType}. Errors found.`);
            
            // Throw a structured, immutable failure record for the Audit/Quarantine layers
            throw Object.freeze({
                isValid: false,
                errors: Object.freeze(validationResult.errors),
                mutationType: mutationType
            });
        }
    }
}