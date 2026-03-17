/**
 * MADR: Mutation Artifact Definition Repository Kernel
 * V100.0.0: High-Fidelity Schema Governance Service Kernel
 *
 * Provides versioned, immutable storage and asynchronous validation endpoints for key GSEP artifacts (M-01 Intent, M-02 Payload).
 * All operations are delegated to specialized, asynchronous Tool Kernels to ensure non-blocking execution and auditable control flow.
 */

// --- Custom Error Definitions (Maintained for Governance Layer Context) ---
class GovernanceError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'GovernanceError';
        this.context = context;
    }
}

class ValidationFailureError extends GovernanceError {
    constructor(message, validationErrors, context = {}) {
        super(message, context);
        this.name = 'ValidationFailureError';
        this.validationErrors = validationErrors;
    }
}
// --------------------------------------------------------------------------

/**
 * MutationArtifactDefinitionRepositoryKernel (MADR)
 * Replaces synchronous dependency loading and custom compilation logic with auditable Tool Kernels.
 */
class MutationArtifactDefinitionRepositoryKernel {
    /**
     * @param {PayloadSchemaRegistryKernel} payloadSchemaRegistryKernel - Loads canonical artifact schemas asynchronously.
     * @param {ISpecValidatorKernel} specValidatorKernel - Handles schema compilation and payload validation asynchronously.
     */
    constructor(payloadSchemaRegistryKernel, specValidatorKernel) {
        if (!payloadSchemaRegistryKernel || !specValidatorKernel) {
            throw new Error("MADR Kernel requires PayloadSchemaRegistryKernel and ISpecValidatorKernel dependencies.");
        }
        this.schemaRegistry = payloadSchemaRegistryKernel;
        this.validator = specValidatorKernel;
        this.initialized = false;
    }

    /**
     * Asynchronously initializes the repository by loading all schemas and registering them
     * with the ISpecValidatorKernel for compilation.
     */
    async initialize() {
        if (this.initialized) return;

        // 1. Load all artifact schemas asynchronously from the audited registry (Replaces synchronous file I/O)
        const allSchemas = await this.schemaRegistry.getAllSchemas();

        try {
            // 2. Register all schemas with the SpecValidatorKernel for compilation (Replaces _compileAllSchemas and VCR Proxy)
            for (const artifactId in allSchemas) {
                for (const version in allSchemas[artifactId]) {
                    const schema = allSchemas[artifactId][version];
                    const key = `${artifactId}:${version}`;
                    
                    // ISpecValidatorKernel handles compilation/storage of the validator function internally
                    await this.validator.registerSchema(key, schema);
                }
            }
            this.initialized = true;
        } catch (e) {
            throw new GovernanceError(`MADR Critical Initialization Error: Schema registration/compilation failed: ${e.message}`, { details: e });
        }
    }

    /**
     * Retrieves the canonical schema definition for a given artifact ID and version.
     * Delegates lookup to the audited Schema Registry Kernel.
     *
     * @param {string} artifactId - e.g., 'M-01', 'M-02'
     * @param {string} [version='latest'] - Specific schema version string.
     * @returns {Promise<Readonly<object>>} The schema definition object.
     * @throws {GovernanceError} If the definition is missing.
     */
    async getSchema(artifactId, version = 'latest') {
        try {
            // Rely on the registry kernel for the canonical source of truth
            const schema = await this.schemaRegistry.getSchema(artifactId, version);
            return Object.freeze(schema);
        } catch (e) {
            // Assuming schema registry throws a structured error on lookup failure
            throw new GovernanceError(`MADR Lookup Error (G-001/G-002): Artifact ID "${artifactId}" v"${version}" not registered.`, { originalError: e });
        }
    }

    /**
     * Validates an artifact payload against its mandatory schema (defaults to 'latest').
     * Delegates validation execution to the ISpecValidatorKernel.
     *
     * @param {string} artifactId - e.g., 'M-01', 'M-02'
     * @param {object} payload - The artifact data to validate.
     * @param {string} [version='latest'] - Specific schema version string.
     * @returns {Promise<true>} True if validation passes.
     * @throws {ValidationFailureError} If validation fails.
     */
    async validate(artifactId, payload, version = 'latest') {
        if (!this.initialized) {
            throw new GovernanceError("MADR Kernel has not been initialized.");
        }
        
        const key = `${artifactId}:${version}`;

        try {
            // 1. Use the audited Spec Validator Kernel for execution
            const validationResult = await this.validator.validatePayloadAgainstSchema(key, payload);
            
            if (!validationResult.isValid) {
                // 2. Propagate structured validation failure
                const context = {
                    artifactId: artifactId,
                    version: version,
                    // Truncate payload for secure logging/debugging context
                    payloadSample: JSON.stringify(payload).substring(0, 150) + '...'
                };

                throw new ValidationFailureError(
                    `Governance Validation Failed for ${artifactId} v${version}. Payload violates canonical schema definition.`,
                    validationResult.errors,
                    context
                );
            }
            return true;
        } catch (e) {
            // Wrap lookup errors or unexpected runtime failures
            if (e.name === 'SchemaNotFoundError' || e.message?.includes('Validator not found')) {
                 throw new GovernanceError(`MADR Lookup Error (G-001/G-002/G-003): Schema key "${key}" not found or compiled.`, { originalError: e });
            }
            if (e.name === 'ValidationFailureError') throw e; // Already a structured error

            // Generic runtime error wrap
            throw new GovernanceError(`MADR Validation Runtime Error for ${key}: ${e.message}`, { originalError: e });
        }
    }
}