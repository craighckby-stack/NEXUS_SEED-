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
     * @param {object} dependencies
     * @param {ActiveStateContextManagerKernel} dependencies.ActiveStateContextManagerKernel
     * @param {object} dependencies.logger - Standard logging utility.
     */
    constructor({ ActiveStateContextManagerKernel, logger }) {
        if (!ActiveStateContextManagerKernel || !logger) {
            throw new Error("StateMetadataRegistryKernel initialization failed: Missing required tool kernels (ActiveStateContextManagerKernel, logger).");
        }

        this.stateManager = ActiveStateContextManagerKernel;
        this.logger = logger;
        // Define a unique, auditable context path for this registry within the state manager.
        this.CONTEXT_PATH = 'governance/metadata/state_registry';
    }

    /**
     * Mandatory asynchronous initialization method.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Delegate initialization logic to ensure the underlying state manager is ready.
        this.logger.info(`StateMetadataRegistryKernel initialized. Context Path: ${this.CONTEXT_PATH}`);
    }

    /**
     * Registers or completely overwrites metadata for a given key. Fully asynchronous.
     * Delegation: Persistence, key validation, and versioning are handled by the ActiveStateContextManagerKernel.
     * @param {string} key - The state identifier.
     * @param {object} metadata - The associated metadata object.
     * @returns {Promise<boolean>}
     */
    async setMetadata(key, metadata) {
        try {
            // The state manager automatically handles validation (key must be string, metadata must be non-array object).
            await this.stateManager.updateState(this.CONTEXT_PATH, key, metadata);
            return true;
        } catch (error) {
            this.logger.error(`[SMRK] Error setting metadata for key ${key}: ${error.message}`);
            // Re-throw the error for upstream handling
            throw error;
        }
    }

    /**
     * Retrieves metadata associated with a key. Fully asynchronous.
     * Delegation: O(1) lookup efficiency and integrity checks are handled by the state manager.
     * @param {string} key - The state identifier.
     * @returns {Promise<object | null>} The metadata object or null if not found.
     */
    async getMetadata(key) {
        try {
            const data = await this.stateManager.getState(this.CONTEXT_PATH, key);
            // The state manager returns null if the key is not found, consistent with the original API.
            return data || null;
        } catch (error) {
            this.logger.warn(`[SMRK] Failed to retrieve metadata for key ${key}: ${error.message}`);
            return null; // Return null on retrieval failure for resilience
        }
    }

    /**
     * Deeply merges partial metadata into an existing entry. Fully asynchronous.
     * Delegation: Atomic merge operation and versioning managed by the state manager's patch functionality.
     * @param {string} key - The state identifier.
     * @param {object} partialMetadata - The properties to merge.
     * @returns {Promise<boolean>}
     */
    async mergeMetadata(key, partialMetadata) {
        try {
            // Use patchState for optimized, auditable merging
            await this.stateManager.patchState(this.CONTEXT_PATH, key, partialMetadata);
            return true;
        } catch (error) {
            this.logger.error(`[SMRK] Error merging metadata for key ${key}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Checks the internal integrity of the registry state via the delegated persistence kernel.
     * Delegation: Integrity checks (hashing, structural conformance) are handled by the ActiveStateContextManagerKernel.
     * @returns {Promise<object>} A report detailing integrity status.
     */
    async checkStateIntegrity() {
        try {
            const report = await this.stateManager.getContextIntegrityReport(this.CONTEXT_PATH);
            
            // Adapt the detailed report structure provided by the kernel to the expected output format.
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