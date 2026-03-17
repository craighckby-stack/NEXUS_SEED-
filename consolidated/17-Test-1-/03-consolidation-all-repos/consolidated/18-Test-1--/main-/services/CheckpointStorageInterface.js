// Define the abstract interface for checkpoint management
class CheckpointStorageInterface {

    /**
     * Initializes the storage mechanism based on config.
     * @param {object} config - The checkpoint configuration.
     */
    constructor(config) {
        if (new.target === CheckpointStorageInterface) {
            throw new TypeError("Cannot construct CheckpointStorageInterface instances directly.");
        }
        this.config = config;
    }

    /**
     * Saves the evolutionary state object.
     * @param {string} runId - The current evolution run ID.
     * @param {object} state - The full state object to serialize.
     * @param {object} metadata - Metadata about the state.
     * @returns {Promise<string>} Path or URL to the saved checkpoint.
     */
    async saveCheckpoint(runId, state, metadata) {
        throw new Error("Method 'saveCheckpoint()' must be implemented.");
    }

    /**
     * Loads the latest or specific checkpoint.
     * @param {string} [checkpointId] - Optional specific ID/path to load.
     * @returns {Promise<object>} The loaded state object.
     */
    async loadCheckpoint(checkpointId) {
        throw new Error("Method 'loadCheckpoint()' must be implemented.");
    }

    /**
     * Cleans up old checkpoints based on max_retained_versions policy.
     * @param {string} runId - The current evolution run ID.
     */
    async cleanUp(runId) {
        throw new Error("Method 'cleanUp()' must be implemented.");
    }
}

module.exports = CheckpointStorageInterface;