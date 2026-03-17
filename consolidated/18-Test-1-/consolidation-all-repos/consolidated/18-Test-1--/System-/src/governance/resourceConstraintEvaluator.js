/**
 * Component ID: RCE
 * Name: Resource Constraint Evaluator
 * Function: Provides dynamic, real-time operational context (e.g., CPU load, I/O latency, memory pressure)
 *           to the MCRA Engine (C-11) by calculating a weighted Constraint Factor derived from tunable thresholds.
 * GSEP Alignment: Stage 3 (P-01 Input)
 * Refactor V94.1: Introduced non-linear (squared deviation) penalty scaling and enhanced structural reporting.
 */

const DEFAULT_CONSTRAINTS = {
    // Note: Metrics are expected to be normalized ratios (0.0 to 1.0)
    cpu_util: { threshold: 0.85, weight: 0.40, severity_boost: 2.0 }, 
    memory_used_ratio: { threshold: 0.90, weight: 0.50, severity_boost: 3.0 }, // Higher penalty for memory, critical path resource
    io_wait_factor: { threshold: 0.60, weight: 0.10, severity_boost: 1.5 }
};

// Constants defining the proximity (warning) zone behavior
const PROXIMITY_BAND_START = 0.75; // Start penalty when metric hits 75% of its threshold
const PROXIMITY_PENALTY_FACTOR = 0.15; // Max penalty fraction when in proximity zone

class ResourceConstraintEvaluator {
    /**
     * @param {Object} metricsService Dependency injected service for system metrics access.
     * @param {Object} [constraintsConfig] Optional configuration, ideally sourced from RuntimeThresholdManager (RTM).
     */
    constructor(metricsService, constraintsConfig = {}) {
        if (!metricsService) {
            throw new Error("MetricsService dependency is required for RCE.");
        }
        this.metricsService = metricsService;
        // Merge configuration for current operational context.
        this.config = {
            ...DEFAULT_CONSTRAINTS,
            ...constraintsConfig
        };
    }

    /**
     * Internal utility to gather all raw metrics.
     * Maps heterogeneous service outputs to a standardized, flat metric structure (0.0 to 1.0).
     * @returns {Object<string, number>} Normalized raw metrics.
     */
    _fetchRawMetrics() {
        try {
            const load = this.metricsService.getCurrentLoad();
            const memory = this.metricsService.getMemoryPressure();
            const iowait = this.metricsService.getIOWaitFactor();

            return {
                // Use nullish coalescing to safely default to 0 if sub-properties are missing
                cpu_util: load?.cpu_util ?? 0,
                memory_used_ratio: memory?.used_ratio ?? 0,
                io_wait_factor: iowait?.iowait_factor ?? 0
            };
        } catch (error) {
            console.error("[RCE] Metric Fetch Critical Error:", error.message);
            // Return zeroed metrics if the underlying service fails, ensuring a safety default.
            return {
                cpu_util: 0,
                memory_used_ratio: 0,
                io_wait_factor: 0
            };
        }
    }

    /**
     * Quantifies raw metrics into a weighted, normalized constraint score using non-linear scaling beyond thresholds.
     * Implements accelerated penalty using the square of normalized deviation beyond the threshold.
     * @param {Object<string, number>} rawMetrics - Flattened current system metrics.
     * @returns {{score: number, triggers: Array<Object>}} Calculated score and detailed list of triggered constraints.
     */
    _calculateAggregateConstraintScore(rawMetrics) {
        let totalWeightedPenalty = 0;
        let effectiveTotalWeight = 0;
        const triggerDetails = [];

        for (const config of Object.values(this.config)) {
            effectiveTotalWeight += config.weight;
        }

        if (effectiveTotalWeight === 0) {
            return { score: 0.0, triggers: [] };
        }

        for (const [metricKey, config] of Object.entries(this.config)) {
            const value = rawMetrics[metricKey];
            if (value === undefined || typeof value !== 'number' || value < 0) continue;

            const { threshold, weight, severity_boost } = config;

            let penalty = 0;
            let triggerType = null;
            
            if (value > threshold) {
                // --- CRITICAL CONSTRAINT VIOLATION ---
                
                // Calculate deviation ratio relative to the remaining capacity (1.0 - threshold)
                const remainingCapacity = 1.0 - threshold;
                
                const deviationRatio = remainingCapacity > 1e-6 // Epsilon check
                    ? Math.min(1.0, (value - threshold) / remainingCapacity) 
                    : (value > threshold ? 1.0 : 0.0);

                // Non-linear acceleration: Penalty accelerates based on severity_boost * square of deviation
                // The 1 + factor ensures a minimum linear penalty plus the accelerated boost.
                penalty = weight * deviationRatio * (1 + (deviationRatio ** 2) * severity_boost);
                
                // Penalty should never exceed the metric's configured weight
                penalty = Math.min(weight, penalty);
                
                triggerType = 'CRITICAL';

            } else if (value > threshold * PROXIMITY_BAND_START) {
                // --- PROXIMITY CONSTRAINT (WARNING ZONE) ---

                // Linearly scale minor penalty based on depth into the proximity band
                const proximityStartValue = threshold * PROXIMITY_BAND_START;
                const proximityBandWidth = threshold - proximityStartValue;

                const proximityScale = proximityBandWidth > 1e-6 
                    ? (value - proximityStartValue) / proximityBandWidth 
                    : 0;
                
                penalty = weight * PROXIMITY_PENALTY_FACTOR * proximityScale;
                triggerType = 'PROXIMITY';
            }

            if (penalty > 0) {
                totalWeightedPenalty += penalty;
                triggerDetails.push({
                    metric: metricKey,
                    value: value.toFixed(3),
                    threshold: threshold.toFixed(3),
                    weight: weight.toFixed(2),
                    penalty_contribution: penalty.toFixed(4),
                    type: triggerType
                });
            }
        }

        // Normalize the aggregated weighted penalty by the total configuration weight.
        const normalizedScore = Math.min(1.0, totalWeightedPenalty / effectiveTotalWeight);

        return {
            score: normalizedScore,
            triggers: triggerDetails
        };
    }

    /**
     * Gathers current environmental constraints and quantifies them into a contextual overhead metric.
     * @returns {{constraintMetric: number, triggeredConstraints: Array<Object>, details: Object}} 
     */
    getOperationalContext() {
        const rawMetrics = this._fetchRawMetrics();
        const scoreData = this._calculateAggregateConstraintScore(rawMetrics);

        return {
            constraintMetric: parseFloat(scoreData.score.toFixed(4)), // Normalized factor (0.0 to 1.0)
            triggeredConstraints: scoreData.triggers, // Detailed list of factors, including contribution
            details: rawMetrics
        };
    }

    /**
     * Primary interface for the MCRA Engine (C-11).
     * @returns {number} A normalized factor (0.0 to 1.0) representing current resource scarcity/instability.
     */
    getConstraintFactor() {
        return this.getOperationalContext().constraintMetric;
    }
}

module.exports = ResourceConstraintEvaluator;
