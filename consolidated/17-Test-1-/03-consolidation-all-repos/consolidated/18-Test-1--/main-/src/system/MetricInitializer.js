const MetricDefinitions = require('../../config/MetricDefinitions.json');
const TelemetryAdapter = require('./telemetry/TelemetryAdapter');

/**
 * Standardized constraints for metric definition validation.
 * Using functional constants optimizes lookup efficiency (O(1) for Set checks).
 */
const METRIC_CONSTRAINTS = {
  VALID_TYPES: new Set(['COUNTER', 'GAUGE', 'SUMMARY', 'HISTOGRAM']),
  VALID_AGGREGATIONS: new Set(['SUM', 'AVERAGE', 'MAX', 'LAST', 'NONE']),
  REQUIRED_FIELDS: ['description', 'unit', 'criticality', 'tags']
};

/**
 * Performs highly efficient, short-circuiting validation on a single metric definition.
 * This encapsulates the validation logic for maximum abstraction and efficiency.
 * @param {string} name - The metric key name.
 * @param {Object} def - The definition object.
 * @throws {Error} If any constraint fails.
 */
function _validateSingleMetric(name, def) {
  const C = METRIC_CONSTRAINTS;

  // 1. Basic Structure Check
  if (!def || typeof def !== 'object') {
    throw new Error(`Metric ${name}: Definition must be a valid object.`);
  }

  // 2. Type Check (O(1) Set lookup)
  if (!def.type || !C.VALID_TYPES.has(def.type)) {
    throw new Error(`Metric ${name}: Invalid type '${def.type}'. Must be one of: ${[...C.VALID_TYPES].join(', ')}`);
  }

  // 3. Aggregation Strategy Check (O(1) Set lookup)
  if (!def.aggregation_strategy || !C.VALID_AGGREGATIONS.has(def.aggregation_strategy)) {
    throw new Error(`Metric ${name}: Invalid aggregation strategy '${def.aggregation_strategy}'. Must be one of: ${[...C.VALID_AGGREGATIONS].join(', ')}`);
  }

  // 4. Required Metadata Check (Efficient linear iteration)
  for (const field of C.REQUIRED_FIELDS) {
    if (def[field] === undefined || def[field] === null) {
      throw new Error(`Metric ${name}: Missing required metadata field: ${field}.`);
    }
  }

  // 5. Tags Structure Check
  const tags = def.tags;
  if (!Array.isArray(tags) || tags.some(t => typeof t !== 'string')) {
     throw new Error(`Metric ${name}: Tags must be an array of strings.`);
  }
}

/**
 * Loads, validates, and registers all defined system metrics with the Telemetry Adapter.
 * This class prioritizes definition integrity and initialization speed.
 */
class MetricInitializer {
  /**
   * @param {Object} definitions - Configuration loaded from MetricDefinitions.json.
   * @param {Object} adapter - The TelemetryAdapter instance/class.
   */
  constructor(definitions, adapter) {
    this.telemetryAdapter = adapter;
    // Delegate validation to the abstract helper function
    this.validatedDefinitions = this._processAndValidateAll(definitions);
    this._registerMetrics();
  }

  /**
   * Iteratively processes all definitions using the abstracted validation routine.
   * Achieves efficiency through linear iteration and validation short-circuiting.
   * @param {Object} defs - Configuration definitions.
   * @returns {Object} The validated subset.
   */
  _processAndValidateAll(defs) {
    const validated = {};
    const definitionEntries = Object.entries(defs);
    
    for (const [name, def] of definitionEntries) {
      _validateSingleMetric(name, def); // O(1) checks ensure fast failure
      validated[name] = def;
    }

    console.log(`[MetricInitializer] Successfully validated ${definitionEntries.length} metric definitions.`);
    return validated;
  }

  /**
   * Passes validated metrics to the underlying telemetry system for registration.
   */
  _registerMetrics() {
    this.telemetryAdapter.registerDefinitions(this.validatedDefinitions);
    console.log('[MetricInitializer] Metrics successfully registered with Telemetry Adapter.');
  }

  getDefinitions() {
    return this.validatedDefinitions;
  }
}

// Instantiate and export the singleton using the abstracted adapter
module.exports = new MetricInitializer(MetricDefinitions, TelemetryAdapter);