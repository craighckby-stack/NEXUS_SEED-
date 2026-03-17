/**
 * EnvironmentalSensorHub v94.2
 * MISSION: Decouples high-frequency synchronous monitoring (CRM) from potentially slow, 
 * asynchronous sensor data collection (OS metrics, network probes, distributed services).
 * Utilizes self-correcting timers (recursive setTimeout) for stable, non-overlapping collection cycles (Bounded Execution Model).
 */
export class EnvironmentalSensorHub {
    constructor(collectionInterval_ms = 1000) {
        // Cache holds the latest atomically updated sensor data (Map for dynamic key management)
        this.cache = new Map();
        
        this.collectionInterval_ms = collectionInterval_ms;
        this.isRunning = false;
        this.timeoutHandle = null;
        this.isCollecting = false; // Concurrency guard

        // sensors will contain { name: string, run: async () => Object<key, value>, keys: string[] }
        this.sensors = []; 
    }

    /**
     * Adds a data source/sensor implementation.
     * Sensor objects must define a 'name' (string) and an async 'run' method (returns an Object or Map).
     * @param {Object} sensor - The sensor implementation object.
     * @param {string[]} requiredKeys - Keys this sensor promises to return.
     */
    addSensor(sensor, requiredKeys = []) {
        if (typeof sensor.run !== 'function' || !sensor.name) {
            console.error("[SensorHub] Invalid sensor definition. Must define 'name' and async 'run'.");
            return;
        }
        
        this.sensors.push({ ...sensor, keys: requiredKeys });
        // Initialize cache entries for expected keys, potentially setting default values like null/0.
        requiredKeys.forEach(key => {
            if (!this.cache.has(key)) this.cache.set(key, 0);
        });
    }

    startCollection() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`[SensorHub] Starting collection loop every ${this.collectionInterval_ms}ms.`);
        this._collectionLoop();
    }

    stopCollection() {
        if (!this.isRunning) return;
        clearTimeout(this.timeoutHandle);
        this.isRunning = false;
        console.log("[SensorHub] Collection stopped.");
    }

    /**
     * Recursive, self-correcting collection loop using setTimeout.
     * Ensures the next run only starts after the current run completes, preventing overflow.
     */
    _collectionLoop() {
        if (!this.isRunning) return;

        this.collectAllSensors()
            .finally(() => {
                // Schedule the next run after the current cycle finishes.
                const delay = this.collectionInterval_ms; 
                this.timeoutHandle = setTimeout(() => this._collectionLoop(), delay);
            });
    }

    /**
     * Executes all registered sensors concurrently and performs an atomic cache update.
     */
    async collectAllSensors() {
        if (this.isCollecting) return; 
        this.isCollecting = true;
        
        const sensorPromises = this.sensors.map(async (sensor) => {
            try {
                // Sensor run execution (must return an object or map)
                const results = await sensor.run(); 
                return { name: sensor.name, results: results };
            } catch (error) {
                console.warn(`[SensorHub] Sensor failure detected: ${sensor.name}. Error: ${error.message}`);
                return { name: sensor.name, results: null }; // Fail gracefully
            }
        });

        const collectedData = await Promise.all(sensorPromises);
        let aggregatedCache = new Map(this.cache); // Prepare mutable cache snapshot

        for (const data of collectedData) {
            if (data.results) {
                // Merge new data
                Object.entries(data.results).forEach(([key, value]) => {
                    aggregatedCache.set(key, value);
                });
            }
        }
        
        // Atomically replace the public cache after successful aggregation
        this.cache = aggregatedCache;
        this.isCollecting = false;
    }

    // -- Synchronous Read APIs --
    
    /**
     * Generic synchronous reader function used by the ContextualRuntimeMonitor (CRM).
     * @param {string} key
     */
    get(key) {
        return this.cache.get(key);
    }
    
    // Legacy compatibility wrappers (using hardcoded keys for example)
    getSystemLatency() {
        return this.get('criticalLatency') || 0;
    }

    getNormalizedStressIndex() {
        return this.get('normalizedStressIndex') || 0;
    }
}