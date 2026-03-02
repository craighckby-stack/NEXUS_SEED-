/**
 * src/utilities/metricNormalizer.js
 * Role: Utility for ensuring all raw input metrics are reliably scaled to the required [0.0, 1.0] range.
 * This normalization step is crucial for feeding homogeneous data into weighted prioritization algorithms (like EDP).
 */
class MetricNormalizer {

    /**
     * @param {Object} thresholds - Configuration defining max/min bounds for raw metrics.
     * Example structure: {
     *   raw_runtime_ms: { max: 1000, min: 10, inverse: true },
     *   cyclomatic_complexity: { max: 20, min: 2, inverse: true }
     * }
     */
    constructor(thresholds = {}) {
        this.thresholds = thresholds;
    }

    /**
     * Normalizes a single raw metric value into the 0.0 to 1.0 range using Min-Max scaling.
     * The 'inverse' flag handles metrics where lower raw values are desirable (e.g., complexity).
     * @param {string} key - The identifier of the metric (must exist in thresholds).
     * @param {number} value - The raw numeric value.
     * @returns {number} Normalized score (0.0 to 1.0).
     */
    normalize(key, value) {
        const config = this.thresholds[key];
        if (!config || typeof value !== 'number') {
            // Unknown metric or non-numeric input is considered unscoreable for safety.
            return 0.0; 
        }

        const { max, min, inverse } = config;
        
        if (max <= min) {
            // Invalid range or zero range -> neutral score
            return 0.5; 
        }

        // Clamp the value within the defined range before scaling
        const clampedValue = Math.min(max, Math.max(min, value));

        // Basic Min-Max scaling
        let normalized = (clampedValue - min) / (max - min);

        // Apply inverse scaling if necessary
        if (inverse) {
            normalized = 1.0 - normalized;
        }

        // Strict bounds enforcement
        return Math.min(1.0, Math.max(0.0, normalized));
    }

    /**
     * Normalizes an entire map of raw metrics based on the configured thresholds.
     * This is the primary interface for upstream systems (like SEA).
     * @param {Object<string, number>} rawMetrics - Input metrics map.
     * @returns {Object<string, number>} Normalized metrics map ready for EDP intake.
     */
    processArtifactMetrics(rawMetrics) {
        const normalized = {};
        for (const key in rawMetrics) {
            if (this.thresholds.hasOwnProperty(key)) {
                normalized[key] = this.normalize(key, rawMetrics[key]);
            } else {
                // Only normalize configured metrics, ignoring others.
            }
        }
        return normalized;
    }
}

module.exports = MetricNormalizer;