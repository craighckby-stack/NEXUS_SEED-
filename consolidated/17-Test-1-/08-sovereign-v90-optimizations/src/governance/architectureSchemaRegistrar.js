class ArchitectureSchemaRegistryKernel {
    /**
     * @param {object} dependencies
     * @param {ILoggerToolKernel} dependencies.logger - High-integrity logger tool.
     */
    constructor(dependencies) {
        this._schemas = new Map();
        this._logger = null;
        this.#setupDependencies(dependencies);
    }

    /**
     * Isolates and validates required dependencies.
     * @param {object} dependencies
     */
    #setupDependencies({ logger }) {
        if (!logger) {
            throw new Error("ArchitectureSchemaRegistryKernel requires ILoggerToolKernel for auditable operations.");
        }
        this._logger = logger;
    }

    /**
     * Asynchronously initializes the kernel, replacing synchronous singleton initialization.
     * @returns {Promise<void>}
     */
    async initialize() {
        await this._logger.info("ArchitectureSchemaRegistryKernel starting initialization.");
        // Configuration loading (if external schemas were needed) would occur here, 
        // utilizing SecureResourceLoaderInterfaceKernel or a dedicated registry.
        await this._logger.info("ArchitectureSchemaRegistryKernel initialized successfully, ready for schema registration.");
    }

    /**
     * Registers an architecture schema definition asynchronously.
     * @param {string} name - The unique identifier for the schema.
     * @param {object} schemaDefinition - The schema structure (e.g., JSON schema).
     * @returns {Promise<boolean>} True if successfully registered, false if already exists or invalid.
     */
    async register(name, schemaDefinition) {
        if (!name || !schemaDefinition || this._schemas.has(name)) {
            await this._logger.warn(`Schema registration failed for: ${name}. Reason: Name missing, definition invalid, or already exists.`);
            return false;
        }

        this._schemas.set(name, schemaDefinition);
        await this._logger.debug(`Registered architectural schema: ${name}`);
        return true;
    }

    /**
     * Retrieves a registered schema definition.
     * @param {string} name - The unique identifier.
     * @returns {object | undefined} The schema definition or undefined.
     */
    get(name) {
        return this._schemas.get(name);
    }

    /**
     * Checks for the existence of a schema.
     * @param {string} name - The unique identifier.
     * @returns {boolean}
     */
    has(name) {
        return this._schemas.has(name);
    }

    /**
     * Returns an iterator over all registered schema names.
     * @returns {IterableIterator<string>}
     */
    keys() {
        return this._schemas.keys();
    }
}