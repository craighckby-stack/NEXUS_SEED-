import * as os from 'os';

interface SystemLoadMetrics {
    osCpuLoad1m: number;
    osMemoryUsagePercent: string; // Stored as a fixed precision string
    osTotalMemoryBytes: number;
}

/**
 * A concrete example of a sensor component adhering to the Hub's expected interface.
 * Measures CPU load and memory usage.
 */
class SystemLoadSensor {
    public readonly name: string;

    constructor() {
        this.name = 'SystemLoadSensor';
    }

    /**
     * Gathers OS-level load metrics.
     * @returns {Promise<SystemLoadMetrics>} Map of collected telemetry keys and values.
     */
    public async run(): Promise<SystemLoadMetrics> {
        // Note: This artificial delay simulates real I/O or heavier processing
        // and keeps the sensor interface consistent with other async sensors.
        await new Promise(resolve => setTimeout(resolve, 5)); 

        const freeMemory: number = os.freemem();
        const totalMemory: number = os.totalmem();
        const usedMemory: number = totalMemory - freeMemory;
        const loadAverages: number[] = os.loadavg();

        return {
            osCpuLoad1m: loadAverages[0], // 1 minute load average
            osMemoryUsagePercent: (usedMemory / totalMemory).toFixed(4),
            osTotalMemoryBytes: totalMemory
        };
    }
}

export default new SystemLoadSensor();