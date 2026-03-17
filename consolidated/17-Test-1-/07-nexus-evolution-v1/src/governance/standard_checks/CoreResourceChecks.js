/**
 * CORE RESOURCE CHECKS
 * ID: RCR-C01
 * GSEP Role: Provides standardized, basic, pre-defined resource checks to be registered
 * with the ResourceCheckRegistry upon system boot.
 */

const { 
    SYS_CPU_U, 
    SYS_MEM_A, 
    SYS_CLOCK_S 
} = require('../../governance/constants/MetricConstants'); 

// NOTE: Standard type definitions (ResourceCheckFunction, GovernanceConfig, MonitorInterface) 
// are assumed to be handled by JSDoc/TypeScript imports and are omitted for pure code refactoring efficiency.

/**
 * High-Order Function (HOF) to generate specialized, efficient resource check functions.
 * This implementation maximizes recursive abstraction by centralizing the asynchronous
 * execution pipeline, error handling (fallbacks), and comparison logic.
 *
 * @param {object} definition - Configuration object defining the check parameters.
 * @returns {ResourceCheckFunction} The executable asynchronous check function.
 */
const createResourceCheck = (definition) => {
    const { 
        metadataKey, configKey, hardDefault, 
        metricId, unit, 
        metricExtractor, comparator, 
        monitorFunction = 'getSystemMetrics' 
    } = definition;

    return async (monitor, governanceConfig, metadata) => {
        // 1. Unified Threshold Retrieval (Optimized using safe navigation and nullish coalescing)
        const required = metadata.requiredResources?.[metadataKey] 
            ?? governanceConfig?.[configKey] 
            ?? hardDefault;

        // 2. Optimized Metric Retrieval: Dynamically select monitoring call based on definition
        const metrics = (monitorFunction === 'getTimeSyncMetrics') 
            ? await monitor.getTimeSyncMetrics() 
            : await monitor.getSystemMetrics();

        // 3. Current Value Extraction and Worst-Case Fallback
        const current = metricExtractor(metrics);
        
        // 4. Comparison Logic
        const success = comparator(current, required);
        
        // 5. Unified Result Formatting
        return {
            success,
            details: {
                current,
                required,
                unit,
                measurementId: metricId
            }
        };
    };
};

// --- Standard Check Definitions (Configuration Data) ---

const checkDefinitions = {
    cpuUtilization: {
        metadataKey: 'cpuThreshold',
        configKey: 'defaultCpuThreshold',
        hardDefault: 75,
        metricId: SYS_CPU_U,
        unit: '%',
        // Fallback: 100% usage (Worst Case)
        metricExtractor: (metrics) => metrics?.cpu?.usagePercentage ?? 100, 
        // Logic: Current <= Required
        comparator: (current, required) => current <= required 
    },
    memoryAvailable: {
        metadataKey: 'memoryPercentageMin',
        configKey: 'defaultMemoryMinPercentage',
        hardDefault: 20,
        metricId: SYS_MEM_A,
        unit: '% available',
        // Fallback: 0% available (Worst Case)
        metricExtractor: (metrics) => metrics?.memory?.availablePercentage ?? 0, 
        // Logic: Current >= Required
        comparator: (current, required) => current >= required 
    },
    clockSkew: {
        metadataKey: 'maxClockSkewMs',
        configKey: 'defaultMaxClockSkewMs',
        hardDefault: 1000, // 1 second default
        metricId: SYS_CLOCK_S,
        unit: 'ms',
        monitorFunction: 'getTimeSyncMetrics',
        // Fallback: 1 hour skew (3,600,000 ms - Massive Failure)
        metricExtractor: (metrics) => metrics?.clockSkewMs ?? 3600000, 
        // Logic: Absolute Skew <= Required
        comparator: (current, required) => Math.abs(current) <= required 
    }
};

// --- Exported Checks (Generated via HOF) ---

const cpuUtilizationCheck = createResourceCheck(checkDefinitions.cpuUtilization);
const memoryAvailableCheck = createResourceCheck(checkDefinitions.memoryAvailable);
const clockSkewCheck = createResourceCheck(checkDefinitions.clockSkew);


module.exports = {
    cpuUtilizationCheck,
    memoryAvailableCheck,
    clockSkewCheck
};
