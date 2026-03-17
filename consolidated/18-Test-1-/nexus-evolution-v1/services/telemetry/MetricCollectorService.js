// Class responsible for standardizing metric ingestion and normalization.
class MetricCollectorService {
  constructor(telemetryAdapter) {
    this.adapter = telemetryAdapter;
    this.metricCache = {};
  }

  // Ingests raw data, validates structure, and normalizes metric keys based on TQM mapping.
  async ingestAndNormalizeMetrics(rawData, sourceIdentifier) {
    // Implementation logic to map incoming vendor/runtime metric names
    // (e.g., 'SonarQube.CC') to governance keys (e.g., 'code.cyclomatic_complexity').
    const normalizedMetrics = this.processRawData(rawData, sourceIdentifier);
    Object.assign(this.metricCache, normalizedMetrics);
    return normalizedMetrics;
  }

  getMetricValue(metricKey) {
    return this.metricCache[metricKey] || null;
  }

  // Method exposed to TQM Policy Engine for policy evaluation.
  getMetricsForPolicyEvaluation(policyKeys) {
    return policyKeys.reduce((acc, key) => {
      acc[key] = this.getMetricValue(key);
      return acc;
    }, {});
  }
}

module.exports = MetricCollectorService;