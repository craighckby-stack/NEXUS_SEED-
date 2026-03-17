/**
 * SRM: System Resource Monitor
 * Provides continuous, standardized reporting on core Node.js process health (CPU, Memory, Event Loop).
 * This utility acts as the foundation for *predictive* governance monitoring.
 */

// Global dependencies (v8, os) and module-level state (startTime, eventLoopLastCheck) removed,
// as metric calculation is delegated to the stateful NodeProcessMetricsCollector plugin.

// CRITICAL ASSUMPTION: NodeProcessMetricsCollector (the plugin instance) is available globally
// via AGI-KERNEL Plugin System, as it manages time deltas and calculation.

/**
 * @typedef {object} ResourceMetrics
 * @property {number} timestamp - Time of measurement (MS).
 * @property {number} heapTotal - V8 total heap size (bytes).
 * @property {number} heapUsed - V8 used heap size (bytes).
 * @property {number} externalMem - Memory used by C++ objects bound to JS objects (bytes).
 * @property {number} rss - Resident Set Size (total memory occupied by process) (bytes).
 * @property {number} cpuUsage - Process CPU usage relative to total system capacity (0.0 to 1.0).
 * @property {number} eventLoopLatencyMs - Approximate event loop latency in milliseconds.
 */

class SystemResourceMonitor {

    /**
     * Gathers and calculates current resource utilization metrics.
     * @returns {ResourceMetrics}
     */
    static getMetrics() {
        // Ensure the stateful plugin instance is available.
        if (typeof NodeProcessMetricsCollector === 'undefined' || typeof NodeProcessMetricsCollector.execute !== 'function') {
            throw new Error("NodeProcessMetricsCollector plugin must be loaded and available.");
        }

        // Delegate all metric calculation and state management to the specialized plugin instance.
        return NodeProcessMetricsCollector.execute();
    }

    /**
     * Helper for diagnostics: returns basic memory status.
     * Implementing this makes SRM compatible with GHM's Diagnosable interface if needed.
     * @returns {Promise<void>}
     */
    static async runDiagnostics() {
        const metrics = SystemResourceMonitor.getMetrics();
        // Example check: ensure used heap is not approaching total heap (indicative of OOM potential)
        const heapUtilization = metrics.heapUsed / metrics.heapTotal;
        
        if (heapUtilization > 0.95) {
             throw new Error(`Critical Memory Utilization: Heap Utilization ${heapUtilization.toFixed(2)}`);
        }
    }
}

module.exports = SystemResourceMonitor;