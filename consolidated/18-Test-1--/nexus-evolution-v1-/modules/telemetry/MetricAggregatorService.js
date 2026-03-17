/**
 * MetricAggregatorService.js
 * Handles the intake of raw, disparate telemetry streams (e.g., Prometheus metrics, API health checks),
 * performs necessary unit conversion, normalization, sampling rate consolidation, and outputs
 * a single, consistent 'ProcessedMetric' object intended for the PhaseEvaluatorEngine.
 */
const EventEmitter = require('events');

/**
 * MetricDataStandardizer instance (assuming injection or accessible global)
 * @typedef {object} MetricDataStandardizerInstance
 * @property {function(object): object} standardize - Function to coerce and standardize raw data.
 */

/**
 * PeriodicRunner instance (injected plugin)
 * @typedef {object} PeriodicRunnerInstance
 * @property {function(): void} start
 * @property {function(): void} stop
 */

class MetricAggregatorService extends EventEmitter {
    #config;
    #logger;
    #aggregatedMetrics = {};
    #sources;
    #metricStandardizer;
    #runner;

    /**
     * @param {object} config - Configuration defining metric sources, sampling intervals, and normalization rules.
     * @param {function} logger - Logging utility.
     * @param {MetricDataStandardizerInstance} [metricStandardizer] - Tool for data normalization.
     * @param {function} [PeriodicRunnerClass] - Class used to manage scheduled metric pushes (from plugin).
     */
    constructor(config, logger = console, metricStandardizer = null, PeriodicRunnerClass = null) {
        super();
        this.#setupDependencies(config, logger, metricStandardizer, PeriodicRunnerClass);
    }

    /**
     * Extracts synchronous dependency resolution and configuration loading.
     * Satisfies the synchronous setup extraction goal.
     */
    #setupDependencies(config, logger, metricStandardizer, PeriodicRunnerClass) {
        if (!config || typeof config !== 'object') {
            this.#throwSetupError('Configuration object is mandatory.');
        }

        this.#config = config;
        this.#logger = logger;
        this.#metricStandardizer = metricStandardizer;
        
        // Setup Sources
        this.#sources = this.#initializeSourcesInternal(config.sources);

        // Setup Runner
        const pushIntervalMs = config.pushIntervalMs || 5000;
        
        if (PeriodicRunnerClass) {
            // Instantiate the runner, binding pushMetrics as the periodic callback
            this.#runner = new PeriodicRunnerClass(
                pushIntervalMs,
                this.pushMetrics.bind(this), // Public method is the callback entry point
                this.#logger
            );
        } else {
            this.#logMissingRunnerWarning();
            // Fallback: implement Null Object pattern for safety
            this.#runner = this.#createNullRunner();
        }
    }

    /**
     * Private helper for initialization, isolating I/O (logging).
     */
    #initializeSourcesInternal(sourceConfigs) {
        if (Array.isArray(sourceConfigs)) {
            this.#logInfo(`Initialized aggregator with ${sourceConfigs.length} metric sources.`);
        }
        return sourceConfigs || [];
    }

    /**
     * Creates a safe null runner implementation.
     */
    #createNullRunner() {
        return {
            start: () => { this.#logWarn('Cannot start aggregation: PeriodicRunner missing.'); },
            stop: () => {}
        };
    }

    /**
     * Standardizes and validates incoming raw metric data based on configuration rules.
     * @param {string} sourceName
     * @param {object} rawData
     */
    ingestRawData(sourceName, rawData) {
        this.#delegateToIngestion(sourceName, rawData);
    }

    /**
     * Isolates core ingestion and aggregation logic.
     */
    #delegateToIngestion(sourceName, rawData) {
        const normalized = this.#delegateToNormalization(sourceName, rawData);
        Object.assign(this.#aggregatedMetrics, normalized);
    }

    /**
     * Applies unit conversion, filtering, and required aggregation/smoothing using the external tool or fallback.
     */
    #delegateToNormalization(source, data) {
        if (this.#metricStandardizer && typeof this.#metricStandardizer.standardize === 'function') {
            return this.#delegateToExternalStandardization(data);
        }

        // Fallback implementation matching the original stub if no tool is provided
        this.#logNormalizationFallbackWarning();
        return this.#performBasicFloatConversion(data);
    }

    /**
     * Delegates execution to the external MetricDataStandardizer tool.
     */
    #delegateToExternalStandardization(data) {
        return this.#metricStandardizer.standardize(data, this.#config.normalizationRules);
    }

    /**
     * Performs the basic float conversion fallback.
     */
    #performBasicFloatConversion(data) {
        const processed = {};
        for (const key in data) {
            const value = data[key];
            if (value !== null && value !== undefined) {
                processed[key] = parseFloat(value);
            }
        }
        return processed;
    }

    /**
     * Starts the periodic push mechanism using the PeriodicRunner.
     */
    start() {
        this.#delegateToStartRunner();
    }

    #delegateToStartRunner() {
        this.#runner.start();
        this.#logInfo(`Metric Aggregator requested start via runner.`);
    }

    /**
     * Stops the periodic push mechanism using the PeriodicRunner.
     */
    stop() {
        this.#delegateToStopRunner();
    }

    #delegateToStopRunner() {
        this.#runner.stop();
    }

    /**
     * Pushes the latest aggregated metrics for phase evaluation.
     * This method serves as the runner's periodic callback interface.
     * @event metricsAggregated
     */
    pushMetrics() {
        this.#delegateToMetricPush();
    }

    #delegateToMetricPush() {
        // Ensure we send a copy to prevent mutation issues downstream
        const payload = {...this.#aggregatedMetrics, timestamp: Date.now()};
        this.emit('metricsAggregated', payload);
    }

    /* --- I/O and Error Proxy Functions -- */

    #throwSetupError(message) {
        throw new Error(`MetricAggregatorService Setup Error: ${message}`);
    }

    #logInfo(message) {
        if (this.#logger && typeof this.#logger.info === 'function') {
            this.#logger.info(message);
        }
    }

    #logWarn(message) {
        if (this.#logger && typeof this.#logger.warn === 'function') {
            this.#logger.warn(message);
        }
    }

    #logMissingRunnerWarning() {
        this.#logWarn('PeriodicRunnerClass not provided. Periodic push functionality is unavailable.');
    }

    #logNormalizationFallbackWarning() {
        this.#logWarn('MetricDataStandardizer not provided. Using basic parseFloat fallback.');
    }
}

module.exports = MetricAggregatorService;