/**
 * MetricAggregationKernel
 * Manages the execution, aggregation, and threshold monitoring for metrics and oracles.
 */
class MetricAggregationKernel {
    #configRegistry; // IMetricAggregationConfigRegistryKernel
    #logger; // ILoggerToolKernel
    #thresholdMonitor; // IMetricThresholdMonitorToolKernel
    #metricExecutionTool; // IMetricExecutionToolKernel

    // Internal State
    #metricHistory = {};

    /**
     * @param {IMetricAggregationConfigRegistryKernel} configRegistry - Registry for metrics and oracle configurations.
     * @param {ILoggerToolKernel} logger - Standardized logging interface.
     * @param {IMetricThresholdMonitorToolKernel} thresholdMonitor - Tool for monitoring results against thresholds.
     * @param {IMetricExecutionToolKernel} metricExecutionTool - Tool for executing specific metrics and oracles.
     */
    constructor(
        configRegistry,
        logger,
        thresholdMonitor,
        metricExecutionTool
    ) {
        this.#setupDependencies(configRegistry, logger, thresholdMonitor, metricExecutionTool);
    }

    /**
     * Synchronously validates and assigns all required dependencies.
     */
    #setupDependencies(configRegistry, logger, thresholdMonitor, metricExecutionTool) {
        if (!configRegistry || typeof configRegistry.getConfig !== 'function') {
            throw new Error("MetricAggregationKernel requires a valid IMetricAggregationConfigRegistryKernel.");
        }
        if (!logger || typeof logger.warn !== 'function' || typeof logger.error !== 'function') {
            throw new Error("MetricAggregationKernel requires a valid ILoggerToolKernel.");
        }
        if (!thresholdMonitor || typeof thresholdMonitor.monitor !== 'function') {
            throw new Error("MetricAggregationKernel requires a valid IMetricThresholdMonitorToolKernel.");
        }
        if (!metricExecutionTool || typeof metricExecutionTool.executeOracle !== 'function' || typeof metricExecutionTool.calculateMetric !== 'function') {
            throw new Error("MetricAggregationKernel requires a valid IMetricExecutionToolKernel.");
        }

        this.#configRegistry = configRegistry;
        this.#logger = logger;
        this.#thresholdMonitor = thresholdMonitor;
        this.#metricExecutionTool = metricExecutionTool;
    }

    /**
     * Executes a specific evaluation pipeline based on the specified tier.
     * @param {string} tier - e.g., 'lightweight_validation'
     * @param {object} context - Runtime data needed for oracle execution.
     * @returns {Promise<Record<string, any>>} Results mapping metric/oracle IDs to outcomes.
     */
    async runTieredEvaluation(tier, context) {
        const config = this.#configRegistry.getConfig();
        const pipeline = config.default_evaluation_pipeline?.[tier];

        if (!pipeline) {
            this.#logger.warn(`No pipeline defined for tier: ${tier}`);
            return {};
        }

        const results = {};
        for (const id of pipeline) {
            if (config.oracles?.[id]) {
                results[id] = await this.#executeOracle(id, config.oracles[id], context);
            } else if (config.metrics?.[id]) {
                results[id] = this.#calculateMetric(id, config.metrics[id]);
            }
        }
        
        const violations = this.#monitorThresholds(results, config);
        
        if (Object.keys(violations).length > 0) {
            this.#logger.warn(`[${tier}] Metric threshold violations detected:`, violations);
        }

        return results;
    }

    /**
     * Executes an oracle component using the injected execution tool.
     */
    async #executeOracle(id, definition, context) {
        return this.#metricExecutionTool.executeOracle(id, definition, context);
    }

    /**
     * Calculates a metric using the injected execution tool and updates internal history.
     */
    #calculateMetric(id, definition) {
        // Delegate calculation, providing history data
        const result = this.#metricExecutionTool.calculateMetric(id, definition, this.#metricHistory);
        
        if (result && result.value !== undefined) {
             // Update internal state after calculation
             this.#metricHistory[id] = { value: result.value, timestamp: Date.now() };
        }

        // Return the resulting value for aggregation
        return result?.value;
    }

    /**
     * Monitors the calculated results against defined configuration thresholds using the dedicated tool.
     */
    #monitorThresholds(results, config) {
        try {
            return this.#thresholdMonitor.monitor({
                results: results,
                config: config
            });
        } catch (error) {
            this.#logger.error("Error encountered during metric threshold monitoring.", error);
            return {};
        }
    }
}

module.exports = MetricAggregationKernel;