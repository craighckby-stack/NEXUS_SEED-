/**
 * AGI-KERNEL v7.11.3 [MetricPresetRegistryKernel]
 * 
 * Encapsulates and manages standardized system measurement identifiers (IDs).
 * This kernel replaces the synchronous MetricConstants file, enforcing
 * asynchronous initialization, dependency injection, and state immutability
 * (freezing the constants) as required for high-integrity governance registries.
 */

class MetricPresetRegistryKernel {
    /**
     * @param {object} dependencies
     * @param {ILoggerToolKernel} dependencies.loggerKernel - The high-integrity logger tool.
     */
    constructor({ loggerKernel }) {
        this._logger = loggerKernel;
        this._metrics = null;
        this.#setupDependencies();
    }

    #setupDependencies() {
        if (!this._logger || typeof this._logger.info !== 'function') {
            throw new Error("MetricPresetRegistryKernel requires a valid ILoggerToolKernel dependency.");
        }
    }

    /**
     * Asynchronously loads, validates, and freezes the metric preset configuration.
     * @returns {Promise<boolean>}
     */
    async initialize() {
        this._logger.info('Initializing Metric Preset Registry Kernel...');

        // Standardized Metric Identifiers
        const coreMetrics = {
            // System Resource Utilization
            SYS_CPU_U: 'SYS_CPU_U',
            SYS_MEM_A: 'SYS_MEM_A',
            SYS_DISK_IO: 'SYS_DISK_IO',

            // Time & Synchronization
            SYS_CLOCK_S: 'SYS_CLOCK_S',

            // Operational Metrics
            OP_TASK_Q_L: 'OP_TASK_Q_L',
            OP_LATENCY_AVG: 'OP_LATENCY_AVG',

            // Health Status Indicators
            HEALTH_STATUS: 'HEALTH_STATUS'
        };

        // Ensure immutability for governance reliability
        this._metrics = Object.freeze(coreMetrics);
        
        this._logger.debug('Metric presets successfully loaded and frozen.');
        return true;
    }

    /**
     * Retrieves the complete set of standardized metric IDs.
     * This method is synchronous, ensuring fast read access to the initialized, frozen state.
     * @returns {Object} Frozen object containing metric ID constants.
     */
    getPresets() {
        if (!this._metrics) {
            throw new Error("MetricPresetRegistryKernel: Attempted read before initialization.");
        }
        return this._metrics;
    }
    
    /**
     * Retrieves a specific metric ID constant by key.
     * @param {string} key
     * @returns {string | undefined}
     */
    getMetricId(key) {
        if (!this._metrics) {
            throw new Error("MetricPresetRegistryKernel: Attempted read before initialization.");
        }
        return this._metrics[key];
    }
}

module.exports = MetricPresetRegistryKernel;