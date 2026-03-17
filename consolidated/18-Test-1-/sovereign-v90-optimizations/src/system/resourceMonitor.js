/**
 * SRM: System Resource Monitor
 * Provides continuous, standardized reporting on core Node.js process health (CPU, Memory, Event Loop).
 * This utility acts as the foundation for *predictive* governance monitoring.
 */

const CRITICAL_HEAP_UTILIZATION_THRESHOLD = 0.95;

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
     * @throws {Error} If NodeProcessMetricsCollector plugin is not available.
     */
    static getMetrics() {
        if (typeof NodeProcessMetricsCollector === 'undefined' || typeof NodeProcessMetricsCollector.execute !== 'function') {
            throw new Error("NodeProcessMetricsCollector plugin must be loaded and available.");
        }
        return NodeProcessMetricsCollector.execute();
    }

    /**
     * Runs diagnostic checks on system resource metrics.
     * @returns {Promise<void>}
     * @throws {Error} If critical heap utilization threshold is exceeded.
     */
    static async runDiagnostics() {
        const metrics = this.getMetrics();
        const heapUtilization = metrics.heapUsed / metrics.heapTotal;
        
        if (heapUtilization > CRITICAL_HEAP_UTILIZATION_THRESHOLD) {
            throw new Error(`Critical Memory Utilization: Heap Utilization ${heapUtilization.toFixed(2)}`);
        }
    }
}

module.exports = SystemResourceMonitor;
