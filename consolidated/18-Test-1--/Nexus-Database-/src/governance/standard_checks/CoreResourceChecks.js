/**
 * CORE RESOURCE CHECKS
 * ID: RCR-C01
 * GSEP Role: Provides standardized, basic, pre-defined resource checks to be registered
 * with the ResourceCheckRegistry upon system boot.
 */

// Assumed Dependencies: Standardized Metric IDs and necessary type definitions.

/**
 * @typedef {import('../ResourceCheckRegistry').ResourceCheckFunction} ResourceCheckFunction
 * @typedef {import('../../types/GovernanceTypes').GovernanceConfig} GovernanceConfig
 * @typedef {import('../../monitoring/SystemMonitor').MonitorInterface} MonitorInterface
 */
const { 
    SYS_CPU_U, 
    SYS_MEM_A, 
    SYS_CLOCK_S 
} = require('../../governance/constants/MetricConstants'); 

/**
 * Helper function to retrieve the threshold value consistently, prioritizing specific metadata,
 * falling back to governance defaults, and finally a hardcoded system default.
 * 
 * @param {object} metadata - Check metadata, potentially containing requiredResources.
 * @param {GovernanceConfig} governanceConfig - Global governance settings.
 * @param {string} metadataKey - Key in metadata.requiredResources (e.g., 'cpuThreshold').
 * @param {string} configKey - Key in governanceConfig (e.g., 'defaultCpuThreshold').
 * @param {number} hardDefault - Fallback value if no configuration is found.
 * @returns {number}
 */
const _getThreshold = (metadata, governanceConfig, metadataKey, configKey, hardDefault) => {
    // Use safe navigation and nullish coalescing to ensure a valid numeric fallback.
    return metadata.requiredResources?.[metadataKey] 
        ?? governanceConfig?.[configKey] 
        ?? hardDefault;
};

// --- Standard Resource Check Implementations ---

/**
 * Standard CPU Utilization Check.
 * Ensures average CPU usage is below a specified threshold (e.g., 75%).
 * @type {ResourceCheckFunction}
 */
const cpuUtilizationCheck = async (monitor, governanceConfig, metadata) => {
    const required = _getThreshold(metadata, governanceConfig, 
        'cpuThreshold', 'defaultCpuThreshold', 75); 

    // Assume monitor.getSystemMetrics() is used.
    const metrics = await monitor.getSystemMetrics(); 
    // Safety fallback: if metrics fail, assume 100% usage (worst case).
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
};

/**
 * Standard Memory Free Check.
 * Ensures a minimum percentage of free memory is available (e.g., 20%).
 * @type {ResourceCheckFunction}
 */
const memoryAvailableCheck = async (monitor, governanceConfig, metadata) => {
    const requiredPercentage = _getThreshold(metadata, governanceConfig, 
        'memoryPercentageMin', 'defaultMemoryMinPercentage', 20);

    const metrics = await monitor.getSystemMetrics();
    // Safety fallback: if metrics fail, assume 0% available (worst case).
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
};

/**
 * Standard NTP/Clock Synchronization Check.
 * Ensures system clock skew relative to trusted sources is within limits (default 1000ms).
 * @type {ResourceCheckFunction}
 */
const clockSkewCheck = async (monitor, governanceConfig, metadata) => {
    const ONE_SECOND_MS_DEFAULT = 1000;
    
    const maxSkewMs = _getThreshold(metadata, governanceConfig, 
        'maxClockSkewMs', 'defaultMaxClockSkewMs', ONE_SECOND_MS_DEFAULT); 

    const metrics = await monitor.getTimeSyncMetrics(); 
    // Safety fallback: If metrics fail, assume 1 hour skew (massive failure).
    const currentSkewMs = metrics?.clockSkewMs ?? 3600000; 

    // Check if absolute value of skew is within tolerance
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
};


module.exports = {
    cpuUtilizationCheck,
    memoryAvailableCheck,
    clockSkewCheck
};
