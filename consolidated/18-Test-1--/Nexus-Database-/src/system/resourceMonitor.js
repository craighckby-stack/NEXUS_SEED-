/**
 * SRM: System Resource Monitor
 * Provides continuous, standardized reporting on core Node.js process health (CPU, Memory, Event Loop).
 * This utility acts as the foundation for *predictive* governance monitoring.
 */

const v8 = require('v8');
const os = require('os');

// Determine event loop latency monitoring method
// NOTE: This example uses standard process time diff; advanced implementations might use external tools like 'event-loop-lag'.
const startTime = process.hrtime();
let eventLoopLastCheck = startTime;

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
        const memoryUsage = process.memoryUsage();
        const processCpu = process.cpuUsage();

        // 1. Calculate relative CPU usage since the process started (or since last explicit check, if tracking)
        // In a complex monitor, we track periodic delta; here we use overall process lifetime.
        // NOTE: Actual Node.js process.cpuUsage() returns microseconds user/system time.
        const elapsedNs = (process.hrtime(startTime)[0] * 1e9) + process.hrtime(startTime)[1];
        const totalCpuMicroseconds = processCpu.user + processCpu.system;
        
        // Calculate CPU usage as a ratio of CPU time consumed / Wall clock time elapsed.
        // We divide by 10,000 to convert nanoseconds wall time to microseconds wall time.
        const cpuUsageRatio = totalCpuMicroseconds / (elapsedNs / 1000); 

        // 2. Estimate Event Loop Latency
        const diff = process.hrtime(eventLoopLastCheck);
        // Convert [seconds, nanoseconds] to milliseconds
        const eventLoopLatencyMs = (diff[0] * 1000 + diff[1] / 1e6);
        eventLoopLastCheck = process.hrtime();
        
        return {
            timestamp: Date.now(),
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            externalMem: memoryUsage.external,
            rss: memoryUsage.rss,
            // Cap CPU at 100% per core
            cpuUsage: Math.min(1.0, cpuUsageRatio / os.cpus().length),
            // Only return a reasonable latency estimate. This value is highly variable.
            eventLoopLatencyMs: parseFloat(eventLoopLatencyMs.toFixed(3))
        };
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
             throw new Error(`Critical Memory Utilization: ${heapUtilization.toFixed(2)}`);
        }
    }
}

module.exports = SystemResourceMonitor;
