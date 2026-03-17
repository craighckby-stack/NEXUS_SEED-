// Define the abstract interface for checkpoint management
class CheckpointStorageInterface {

    // 1. Privatize state
    #config;

    /**
     * Internal check to ensure the class is not instantiated directly.
     * @throws {TypeError}
     */
    #ensureAbstractClass() {
        // I/O Proxy: Handle runtime setup error for abstract class enforcement
        if (new.target === CheckpointStorageInterface) {
            throw new TypeError("Cannot construct CheckpointStorageInterface instances directly. Must be subclassed.");
        }
    }

    /**
     * 2. Synchronous Setup Extraction
     * Validates dependencies and assigns them to private state.
     * @param {object} config - The checkpoint configuration.
     * @throws {Error} if config is invalid.
     */
    #setupDependencies(config) {
        if (!config || typeof config !== 'object') {
            throw new Error("Initialization failed: Checkpoint configuration must be provided as an object.");
        }
        this.#config = config;
    }

    /**
     * Initializes the storage mechanism based on config.
     * @param {object} config - The checkpoint configuration.
     */
    constructor(config) {
        this.#ensureAbstractClass();
        this.#setupDependencies(config);
    }

    // --- Abstract Method Proxies (Must be implemented by subclass) ---

    /**
     * Saves the evolutionary state object.
     * @param {string} runId - The current evolution run ID.
     * @param {object} state - The full state object to serialize.
     * @param {object} metadata - Metadata about the state.
     * @returns {Promise<string>} A Promise resolving to the identifier (Path or URL) of the saved checkpoint.
     * @throws {Error} if not implemented.
     */
    public saveCheckpoint(runId, state, metadata) {
        // I/O Proxy: Execution failure for unimplemented method
        throw new Error("Abstract method 'saveCheckpoint' must be implemented by subclass.");
    }

    /**
     * Loads the latest or specific checkpoint.
     * @param {string} [checkpointId] - Optional specific ID/path to load.
     * @returns {Promise<object>} A Promise resolving to the loaded state object.
     * @throws {Error} if not implemented.
     */
    public loadCheckpoint(checkpointId) {
        // I/O Proxy: Execution failure for unimplemented method
        throw new Error("Abstract method 'loadCheckpoint' must be implemented by subclass.");
    }

    /**
     * Cleans up old checkpoints based on retention policy defined in the config.
     * @param {string} runId - The current evolution run ID.
     * @returns {Promise<void>}
     * @throws {Error} if not implemented.
     */
    public cleanUp(runId) {
        // I/O Proxy: Execution failure for unimplemented method
        throw new Error("Abstract method 'cleanUp' must be implemented by subclass.");
    }

    /**
     * Protected-style accessor for subclasses to retrieve configuration.
     * @returns {object}
     */
    _getConfig() {
        return this.#config;
    }
}

module.exports = CheckpointStorageInterface;