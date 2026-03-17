/**
 * CORE RESOURCE CHECKS KERNEL
 * ID: RCR-C01-K
 * GSEP Role: Defines standardized, high-integrity resource checks. Replaces synchronous
 * dependencies and ad-hoc utility calls with specialized, asynchronous Tool Kernels.
 */

// Tool Kernel Aliases for strict dependency injection
const ResourceThresholdManagerKernel = 'ResourceThresholdManagerKernel';
const IConceptIdRegistryKernel = 'IConceptIdRegistryKernel';

/**
 * @typedef {import('../ResourceCheckRegistry').ResourceCheckFunction} ResourceCheckFunction
 * @typedef {import('../../types/GovernanceTypes').GovernanceConfig} GovernanceConfig
 * @typedef {import('../../monitoring/SystemMonitor').MonitorInterface} MonitorInterface
 */

class CoreResourceChecksKernel {
    /**
     * @param {Object} toolKernels
     * @param {ResourceThresholdManagerKernel} toolKernels.ResourceThresholdManagerKernel
     * @param {IConceptIdRegistryKernel} toolKernels.IConceptIdRegistryKernel
     */
    constructor(toolKernels) {
        // Delegation of critical responsibilities to specialized, audited Tool Kernels
        this.RTMK = toolKernels[ResourceThresholdManagerKernel];
        this.CIDRK = toolKernels[IConceptIdRegistryKernel];
        
        // Internal state for metrics (resolved asynchronously)
        this.metricConstants = {};
    }

    /**
     * Mandatory asynchronous initialization method adhering to AIA Enforcement Layer mandates.
     * Replaces synchronous constant loading with asynchronous registry access.
     */
    async initialize() {
        // Asynchronously load standardized metric IDs via the specialized registry
        const constants = await this.CIDRK.getConcepts([
            'SYS_CPU_U', 
            'SYS_MEM_A', 
            'SYS_CLOCK_S'
        ]);

        if (!constants || Object.keys(constants).length !== 3) {
             throw new Error("Failed to initialize CoreResourceChecksKernel: Missing required metric constants.");
        }

        this.metricConstants = constants;
        
        // Bind check methods to the instance for proper context management
        this.cpuUtilizationCheck = this._cpuUtilizationCheck.bind(this);
        this.memoryAvailableCheck = this._memoryAvailableCheck.bind(this);
        this.clockSkewCheck = this._clockSkewCheck.bind(this);
    }

    /**
     * Internal wrapper to delegate threshold resolution to the ResourceThresholdManagerKernel.
     * Achieves Maximum Recursive Abstraction by replacing ad-hoc utility calls.
     * @private
     */
    async _resolveThreshold(metadata, governanceConfig, metadataKey, configKey, hardDefault) {
        // Strict delegation to RTMK for auditable, three-tiered threshold resolution
        return this.RTMK.resolveThreshold({
            metadata,
            governanceConfig,
            metadataKey,
            configKey,
            hardDefault
        });
    }


    // --- Standard Resource Check Implementations ---

    /**
     * Standard CPU Utilization Check (Tool-mediated threshold resolution).
     * @private
     * @type {ResourceCheckFunction}
     */
    async _cpuUtilizationCheck(monitor, governanceConfig, metadata) {
        const { SYS_CPU_U } = this.metricConstants;
        
        // Threshold resolution is now asynchronous and delegated to RTMK
        const required = await this._resolveThreshold(metadata, governanceConfig, 
            'cpuThreshold', 'defaultCpuThreshold', 75); 

        // Assume monitor.getSystemMetrics() is provided by the caller/attestation engine
        const metrics = await monitor.getSystemMetrics(); 
        const currentUsage = metrics?.cpu?.usagePercentage ?? 100; 

        const success = currentUsage <= required;
        
        return {
            success,
            details: {
                current: currentUsage,
                required: required,
                unit: '%',
                measurementId: SYS_CPU_U
            }
        };
    }

    /**
     * Standard Memory Free Check (Tool-mediated threshold resolution).
     * @private
     * @type {ResourceCheckFunction}
     */
    async _memoryAvailableCheck(monitor, governanceConfig, metadata) {
        const { SYS_MEM_A } = this.metricConstants;

        // Threshold resolution is now asynchronous and delegated to RTMK
        const requiredPercentage = await this._resolveThreshold(metadata, governanceConfig, 
            'memoryPercentageMin', 'defaultMemoryMinPercentage', 20);

        const metrics = await monitor.getSystemMetrics();
        const currentAvailablePercentage = metrics?.memory?.availablePercentage ?? 0; 

        const success = currentAvailablePercentage >= requiredPercentage;

        return {
            success,
            details: {
                current: currentAvailablePercentage,
                required: requiredPercentage,
                unit: '% available',
                measurementId: SYS_MEM_A
            }
        };
    }

    /**
     * Standard NTP/Clock Synchronization Check (Tool-mediated threshold resolution).
     * @private
     * @type {ResourceCheckFunction}
     */
    async _clockSkewCheck(monitor, governanceConfig, metadata) {
        const { SYS_CLOCK_S } = this.metricConstants;
        const ONE_SECOND_MS_DEFAULT = 1000;
        
        // Threshold resolution is now asynchronous and delegated to RTMK
        const maxSkewMs = await this._resolveThreshold(metadata, governanceConfig, 
            'maxClockSkewMs', 'defaultMaxClockSkewMs', ONE_SECOND_MS_DEFAULT); 

        const metrics = await monitor.getTimeSyncMetrics(); 
        const currentSkewMs = metrics?.clockSkewMs ?? 3600000; 

        const success = Math.abs(currentSkewMs) <= maxSkewMs; 

        return {
            success,
            details: {
                current: currentSkewMs,
                required: maxSkewMs,
                unit: 'ms',
                measurementId: SYS_CLOCK_S
            }
        };
    }
    
    /**
     * Public method to retrieve the registered checks after initialization.
     * @returns {Object<string, ResourceCheckFunction>} The collection of runnable checks.
     */
    getChecks() {
        if (!this.metricConstants.SYS_CPU_U) {
            throw new Error("CoreResourceChecksKernel must be initialized before retrieving checks.");
        }
        return {
            cpuUtilizationCheck: this.cpuUtilizationCheck,
            memoryAvailableCheck: this.memoryAvailableCheck,
            clockSkewCheck: this.clockSkewCheck
        };
    }
}

module.exports = { CoreResourceChecksKernel };