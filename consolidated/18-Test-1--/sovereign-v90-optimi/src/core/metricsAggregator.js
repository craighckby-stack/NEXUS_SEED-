/**
 * MetricsAggregatorKernel
 * Efficiently aggregates time-series data (counts, sums, min/max) and dispatches them
 * using injected kernel tools.
 */
class MetricsAggregatorKernel {
    #dispatcherKernel;
    #loggerKernel;
    #metricPresetRegistry;

    // State
    #metrics;
    #intervalMs;
    #timer = null;
    #startTime;

    /**
     * @param {object} dependencies - Kernel dependencies.
     * @param {IMetricsDispatcherToolKernel} dependencies.IMetricsDispatcherToolKernel - Tool for sending aggregated data.
     * @param {ILoggerToolKernel} dependencies.ILoggerToolKernel - Tool for logging.
     * @param {IMetricPresetRegistryKernel} dependencies.IMetricPresetRegistryKernel - Registry for metric configuration defaults.
     * @param {number} [dependencies.intervalMs] - Optional explicit interval override (in milliseconds).
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Isolates dependency validation and assignment, rigorously enforcing the synchronous setup extraction mandate.
     * @param {object} dependencies
     */
    #setupDependencies(dependencies) {
        if (!dependencies.IMetricsDispatcherToolKernel) {
            throw new Error("MetricsAggregatorKernel requires IMetricsDispatcherToolKernel.");
        }
        if (!dependencies.ILoggerToolKernel) {
            // Assumed to exist based on strategic ledger
            throw new Error("MetricsAggregatorKernel requires ILoggerToolKernel.");
        }
        if (!dependencies.MetricPresetRegistryKernel) { // Note: using MetricPresetRegistryKernel from the tool list
            throw new Error("MetricsAggregatorKernel requires MetricPresetRegistryKernel.");
        }

        this.#dispatcherKernel = dependencies.IMetricsDispatcherToolKernel;
        this.#loggerKernel = dependencies.ILoggerToolKernel;
        this.#metricPresetRegistry = dependencies.MetricPresetRegistryKernel;
        this.#intervalMs = dependencies.intervalMs;
    }

    /**
     * Asynchronously initializes the kernel and loads configuration defaults.
     * @returns {Promise<void>}
     */
    async initialize() {
        this.#metrics = new Map();
        
        // 1. Resolve interval configuration asynchronously
        if (typeof this.#intervalMs !== 'number' || this.#intervalMs <= 0) {
            // Assuming the registry holds a method for standard interval retrieval
            const defaultInterval = await this.#metricPresetRegistry.getMetricAggregationInterval();
            this.#intervalMs = defaultInterval || 60000; // Fallback
        }

        this.#startTime = Date.now();
        this.#loggerKernel.info('MetricsAggregatorKernel initialized.', { intervalMs: this.#intervalMs });
    }

    /**
     * Records a single occurrence of a metric.
     * @param {string} name - The name of the metric (e.g., 'task_latency').
     * @param {number} value - The numerical value of the observation.
     * @param {Object} [tags={}] - Optional tags for dimensioning the metric.
     */
    recordMetric(name, value, tags = {}) {
        if (typeof value !== 'number') return;

        if (!this.#metrics.has(name)) {
            this.#metrics.set(name, { count: 0, sum: 0, min: Infinity, max: -Infinity, tags: tags });
        }
        const data = this.#metrics.get(name);
        
        // Update aggregation statistics
        data.count += 1;
        data.sum += value;
        data.min = Math.min(data.min, value);
        data.max = Math.max(data.max, value);
    }

    /**
     * Aggregates current recorded data, resets internal state, and returns the payload.
     * @returns {Array<Object>} The aggregated metrics payload.
     */
    aggregate() {
        const payload = [];
        const endTime = Date.now();
        const duration = endTime - this.#startTime;

        for (const [name, data] of this.#metrics.entries()) {
            const avg = data.count > 0 ? data.sum / data.count : 0;
            payload.push({
                name: name,
                timestamp: endTime,
                intervalMs: duration,
                count: data.count,
                sum: data.sum,
                min: data.min === Infinity ? 0 : data.min,
                max: data.max === -Infinity ? 0 : data.max,
                average: avg,
                tags: data.tags
            });
        }
        
        // Reset state for the next interval
        this.#metrics.clear();
        this.#startTime = endTime;

        return payload;
    }

    /**
     * Executes aggregation and dispatches the data using the injected kernel tool.
     * @returns {Promise<void>}
     */
    async dispatchMetrics() {
        const payload = this.aggregate();
        if (payload.length > 0) {
            try {
                await this.#dispatcherKernel.dispatch(payload);
            } catch (err) {
                this.#loggerKernel.error("Metrics dispatcher failed during transmission.", { error: err.message, payloadCount: payload.length });
            }
        }
    }

    /**
     * Starts the timed aggregation and dispatch cycle.
     * @returns {void}
     */
    start() {
        if (this.#timer) {
            this.stop();
        }
        
        this.#timer = setInterval(() => {
            // Handle async dispatch safely within setInterval
            this.dispatchMetrics().catch(e => {
                 this.#loggerKernel.error("Fatal error in scheduled metrics dispatch cycle.", { error: e.message });
            });
        }, this.#intervalMs);
        
        this.#loggerKernel.info(`MetricsAggregatorKernel started.`, { intervalMs: this.#intervalMs });
    }

    /**
     * Stops the timed aggregation cycle.
     * @returns {Promise<void>} - Ensures remaining metrics are dispatched before completion.
     */
    async stop() {
        if (this.#timer) {
            clearInterval(this.#timer);
            this.#timer = null;
            this.#loggerKernel.info("MetricsAggregatorKernel stopped.");
            
            // Dispatch any remaining metrics upon stop
            await this.dispatchMetrics();
        }
    }
}