/**
 * AGI-KERNEL v7.11.3 [MetricCollectorKernel]
 * Refactored to enforce Dependency Injection, strict state encapsulation, synchronous setup extraction, and I/O proxy isolation.
 */

/**
 * @typedef {object} TelemetryAdapterInterfaceKernel
 * @property {function(object, string): void} report - Method to report normalized metrics externally.
 */

/**
 * @typedef {object} MetricNormalizerToolKernel
 * @property {function({rawData: object, mappingConfig: object, sourceIdentifier: string}): object} execute - Method to perform metric transformation and standardization.
 */

// Kernel responsible for standardizing metric ingestion, normalization, and caching.
class MetricCollectorKernel {
  #adapter;
  #metricCache = {};
  #normalizer;
  #tqmMappingConfig;

  /**
   * @param {TelemetryAdapterInterfaceKernel} telemetryAdapter - Adapter for external reporting.
   * @param {MetricNormalizerToolKernel} metricNormalizer - Tool for transforming raw metrics.
   * @param {object} tqmMappingConfig - Configuration defining the mapping rules.
   */
  constructor(telemetryAdapter, metricNormalizer, tqmMappingConfig) {
    this.#setupDependencies(telemetryAdapter, metricNormalizer, tqmMappingConfig);
  }

  // --- Setup and Validation ---

  /**
   * Synchronously validates dependencies and internal configuration.
   * Goal: Satisfy the synchronous setup extraction mandate.
   */
  #setupDependencies(telemetryAdapter, metricNormalizer, tqmMappingConfig) {
    if (!telemetryAdapter || typeof telemetryAdapter.report !== 'function') {
      this.#throwSetupError("Telemetry Adapter must be provided and implement 'report' function.");
    }
    if (!metricNormalizer || typeof metricNormalizer.execute !== 'function') {
      this.#throwSetupError("Metric Normalizer Tool must be provided and implement 'execute' function.");
    }
    if (!tqmMappingConfig || typeof tqmMappingConfig !== 'object') {
      this.#throwSetupError("TQM Mapping Configuration object is mandatory.");
    }

    this.#adapter = telemetryAdapter;
    this.#normalizer = metricNormalizer;
    this.#tqmMappingConfig = tqmMappingConfig;
  }

  #throwSetupError(message) {
    throw new Error(`MetricCollectorKernel Setup Error: ${message}`);
  }

  // --- I/O Proxies ---

  /**
   * Delegates the metric normalization task to the injected tool.
   * Goal: Satisfy the I/O proxy creation mandate.
   */
  #delegateToNormalizerExecute(rawData, sourceIdentifier) {
    return this.#normalizer.execute({
      rawData: rawData,
      mappingConfig: this.#tqmMappingConfig,
      sourceIdentifier: sourceIdentifier
    });
  }

  /**
   * Delegates the reporting of normalized metrics to the telemetry adapter.
   * Goal: Satisfy the I/O proxy creation mandate.
   */
  #delegateToTelemetryAdapterReport(normalizedMetrics, sourceIdentifier) {
    this.#adapter.report(normalizedMetrics, sourceIdentifier);
  }

  // --- Internal Helpers ---

  #getMetricValue(metricKey) {
    return this.#metricCache[metricKey] || null;
  }

  // --- Public API ---

  /**
   * Ingests raw data, normalizes it, caches it, and reports it externally.
   */
  async ingestAndNormalizeMetrics(rawData, sourceIdentifier) {
    const normalizedMetrics = this.#delegateToNormalizerExecute(rawData, sourceIdentifier);

    // Update internal cache
    Object.assign(this.#metricCache, normalizedMetrics);

    // Report via adapter
    this.#delegateToTelemetryAdapterReport(normalizedMetrics, sourceIdentifier);

    return normalizedMetrics;
  }

  /**
   * Method exposed to TQM Policy Engine for policy evaluation.
   */
  getMetricsForPolicyEvaluation(policyKeys) {
    return policyKeys.reduce((acc, key) => {
      acc[key] = this.#getMetricValue(key);
      return acc;
    }, {});
  }
}

module.exports = MetricCollectorKernel;