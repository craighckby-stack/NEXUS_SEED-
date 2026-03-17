const { ActiveStateContextManagerKernel } = require('AGI-KERNEL');

/**
 * StateMetadataRegistryKernel
 * Refactored from the synchronous StateMetadataRegistry, this kernel delegates all
 * persistence, versioning, integrity checking, and concurrent state management to the
 * ActiveStateContextManagerKernel, adhering strictly to AIA mandates for asynchronous I/O
 * and Maximum Recursive Abstraction.
 */
class StateMetadataRegistryKernel {
    /**
     * Creates a new StateMetadataRegistryKernel instance.
     * @param {object} dependencies - The required dependencies for the kernel.
     * @param {ActiveStateContextManagerKernel} dependencies.stateManager - The state manager kernel.
     * @param {object} dependencies.logger - Standard logging utility.
     */
    constructor({ stateManager, logger }) {
        if (!stateManager || !logger) {
            throw new Error("StateMetadataRegistryKernel initialization failed: Missing required dependencies (stateManager, logger).");
        }

        this.stateManager = stateManager;
        this.logger = logger;
        this.CONTEXT_PATH = 'governance/metadata/state_registry';
    }

    /**
     * Mandatory asynchronous initialization method.
     * @returns {Promise<void>}
     */
    async initialize() {
        this.logger.info(`StateMetadataRegistryKernel initialized. Context Path: ${this.CONTEXT_PATH}`);
    }

    /**
     * Registers or completely overwrites metadata for a given key.
     * @param {string} key - The state identifier.
     * @param {object} metadata - The associated metadata object.
     * @returns {Promise<boolean>}
     */
    async setMetadata(key, metadata) {
        try {
            await this.stateManager.updateState(this.CONTEXT_PATH, key, metadata);
            return true;
        } catch (error) {
            this.logger.error(`[SMRK] Error setting metadata for key ${key}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves metadata associated with a key.
     * @param {string} key - The state identifier.
     * @returns {Promise<object | null>} The metadata object or null if not found.
     */
    async getMetadata(key) {
        try {
            return await this.stateManager.getState(this.CONTEXT_PATH, key) || null;
        } catch (error) {
            this.logger.warn(`[SMRK] Failed to retrieve metadata for key ${key}: ${error.message}`);
            return null;
        }
    }

    /**
     * Deeply merges partial metadata into an existing entry.
     * @param {string} key - The state identifier.
     * @param {object} partialMetadata - The properties to merge.
     * @returns {Promise<boolean>}
     */
    async mergeMetadata(key, partialMetadata) {
        try {
            await this.stateManager.patchState(this.CONTEXT_PATH, key, partialMetadata);
            return true;
        } catch (error) {
            this.logger.error(`[SMRK] Error merging metadata for key ${key}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Checks the internal integrity of the registry state.
     * @returns {Promise<object>} A report detailing integrity status.
     */
    async checkStateIntegrity() {
        try {
            const report = await this.stateManager.getContextIntegrityReport(this.CONTEXT_PATH);
            
            return {
                integrity_ok: report.integrity_status === 'HEALTHY',
                registry_version: report.current_version,
                totalEntries: report.entry_count,
                lastUpdated: report.last_update_timestamp_ms,
                integrity_issues: report.anomalies || [] 
            };
        } catch (error) {
            this.logger.critical(`[SMRK] Failed to generate state integrity report: ${error.message}`);
            return {
                integrity_ok: false,
                registry_version: -1,
                totalEntries: 0,
                lastUpdated: Date.now(),
                integrity_issues: [{ error: `Integrity service failure: ${error.message}` }]
            };
        }
    }
}

module.exports = StateMetadataRegistryKernel;
