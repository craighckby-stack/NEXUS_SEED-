import { ISpecValidatorKernel } from '../validation/ISpecValidatorKernel.js';
// Placeholder: Assume Logger is injected and ISpecValidatorKernel is available.
// Dependencies (schemas and paths) are now injected configuration.

/**
 * PolicyValidatorKernel: Manages the loading, compilation, and validation of governance policies
 * against defined JSON schemas, centralizing high-assurance validation logic.
 */
export class PolicyValidatorKernel {
    #log;
    #validator;
    #fileLoader;
    #schemaPath;
    #fallbackSchemaDefinition;
    #initialized = false;
    #primarySchemaId = null;
    #fallbackSchemaId = 'minimal-fallback-schema';

    /**
     * @param {object} dependencies - Mandatory configuration dependencies.
     * @param {object} dependencies.logger - Logger instance.
     * @param {string} dependencies.defaultSchemaPath - Primary path to load the governance schema.
     * @param {object} dependencies.fallbackSchemaDefinition - The emergency fallback schema object.
     * @param {ISpecValidatorKernel} dependencies.specValidatorKernel - The validation engine (replaces SchemaValidationEngine).
     * @param {SecureResourceLoaderInterfaceKernel} dependencies.resourceLoaderKernel - Utility for safe resource loading (replaces SafeFileLoader).
     */
    constructor({
        logger,
        defaultSchemaPath,
        fallbackSchemaDefinition,
        specValidatorKernel,
        resourceLoaderKernel
    }) {
        this.#setupDependencies({
            logger,
            defaultSchemaPath,
            fallbackSchemaDefinition,
            specValidatorKernel,
            resourceLoaderKernel
        });
    }

    /**
     * Validates and assigns dependencies and performs synchronous setup.
     * Extracts synchronous configuration and initialization logic from the constructor.
     * @private
     */
    #setupDependencies({ 
        logger,
        defaultSchemaPath,
        fallbackSchemaDefinition,
        specValidatorKernel,
        resourceLoaderKernel
    }) {
        if (!logger || !specValidatorKernel || !resourceLoaderKernel || !defaultSchemaPath || !fallbackSchemaDefinition) {
            throw new Error('PolicyValidatorKernel requires logger, specValidatorKernel, resourceLoaderKernel, defaultSchemaPath, and fallbackSchemaDefinition upon construction.');
        }

        this.#log = logger;
        this.#validator = specValidatorKernel;
        this.#fileLoader = resourceLoaderKernel;
        this.#schemaPath = defaultSchemaPath;
        this.#fallbackSchemaDefinition = fallbackSchemaDefinition;

        // Pre-compile fallback schema immediately for emergency use (Synchronous I/O delegation)
        try {
            this.#delegateToValidatorCompile(
                this.#fallbackSchemaDefinition,
                this.#fallbackSchemaId
            );
            this.#logDebug(`Fallback schema compiled successfully: ${this.#fallbackSchemaId}`);
        } catch (e) {
            this.#logError('Failed to compile synchronous fallback schema:', e.message);
            // Fatal error during setup: must fail initialization
            throw new Error(`Kernel Initialization failure: Cannot compile fallback schema. ${e.message}`);
        }
    }

    // --- Private I/O Proxy Methods ---

    /** @private */
    #logDebug(message) {
        this.#log.debug(message);
    }

    /** @private */
    #logInfo(message) {
        this.#log.info(message);
    }

    /** @private */
    #logWarn(message) {
        this.#log.warn(message);
    }

    /** @private */
    #logError(message, details) {
        this.#log.error(message, details);
    }

    /** @private */
    #delegateToValidatorCompile(schema, id) {
        this.#validator.compileSchema(schema, id);
    }

    /** @private */
    async #delegateToLoaderLoadJson(path, name) {
        return this.#fileLoader.loadJson(path, name);
    }

    /** @private */
    #delegateToValidatorValidate(id, config) {
        return this.#validator.validate(id, config);
    }

    // --- Public Interface ---

    /**
     * Attempts to load the primary governance schema from the defined path and compiles it.
     * If initialization fails, the kernel falls back to the minimal schema.
     * This method is idempotent and must be called before validate().
     * @returns {Promise<void>}
     */
    async initializeValidator() {
        if (this.#initialized) {
            this.#logDebug('Validator already initialized.');
            return;
        }

        try {
            this.#logDebug(`Attempting to load primary schema from ${this.#schemaPath}`);
            
            const primarySchema = await this.#delegateToLoaderLoadJson(
                this.#schemaPath,
                'Primary Governance Schema'
            );

            const schemaId = primarySchema.$id || 'main-governance-schema';
            this.#primarySchemaId = schemaId;

            // Delegation: Compile and register the primary schema
            this.#delegateToValidatorCompile(primarySchema, schemaId);

            this.#logInfo(`Primary governance schema loaded successfully from ${this.#schemaPath}`);

        } catch (error) {
            this.#logWarn(`Initialization failed. ${error.message}. Falling back to ${this.#fallbackSchemaId}.`);

            // Set the active schema ID to the fallback ID
            this.#primarySchemaId = this.#fallbackSchemaId;
        } finally {
             this.#initialized = true;
        }
    }

    /**
     * Validates a configuration object against the currently loaded primary schema (or fallback).
     * @param {object} config - The configuration object to validate.
     * @returns {{isValid: boolean, errors: Array<object>}} Validation result.
     * @throws {Error} If initializeValidator() has not been called.
     */
    validate(config) {
        if (!this.#initialized) {
            throw new Error("Validator kernel must be initialized using initializeValidator() before calling validate().");
        }

        const activeSchemaId = this.#primarySchemaId || this.#fallbackSchemaId;

        // Delegation: Execute validation
        const result = this.#delegateToValidatorValidate(activeSchemaId, config);

        return result;
    }
}