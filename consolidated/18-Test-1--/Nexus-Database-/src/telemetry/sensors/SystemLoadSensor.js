const os = require('os');

/**
 * A concrete example of a sensor component adhering to the Hub's expected interface.
 * Measures CPU load and memory usage.
 */
class SystemLoadSensor {
    constructor() {
        this.name = 'SystemLoadSensor';
    }

    /**
     * Gathers OS-level load metrics.
     * @returns {Promise<Object>} Map of collected telemetry keys and values.
     */
    async run() {
        // Note: Real implementations might involve external calls or heavier processing.
        await new Promise(resolve => setTimeout(resolve, 5)); 

        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        const usedMemory = totalMemory - freeMemory;

        return {
            osCpuLoad1m: os.loadavg()[0], // 1 minute load average
            osMemoryUsagePercent: (usedMemory / totalMemory).toFixed(4),
            osTotalMemoryBytes: totalMemory
        };
    }
}

module.exports = new SystemLoadSensor();