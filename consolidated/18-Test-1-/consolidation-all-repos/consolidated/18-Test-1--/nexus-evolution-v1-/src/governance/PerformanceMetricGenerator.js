/**
 * src/governance/PerformanceMetricGenerator.js
 * Purpose: Aggregates raw audit and performance data into a standardized [0.0, 1.0] metric
 * suitable for updating the Trust Matrix. This layer handles the immediate translation 
 * of operational events (e.g., successful compliance, failure, latency spike) 
 * into a quantified trust impact score, decoupling raw telemetry from trust calculation.
 */
class PerformanceMetricGenerator {
    
    static DEFAULT_WEIGHTS = {
        complianceSuccess: 0.1,    // Base positive contribution (now calculated internally based on ratio)
        policyViolationPenalty: -0.5, // Severe negative impact per violation
        efficiencyDeltaContribution: 0.3, // Weight for continuous operational metrics (e.g., latency/resource usage)
        defaultBaseline: 0.75      // Default optimal performance score
    };

    /**
     * @param {Object} [config={}] - Optional configuration overrides for weight distribution.
     */
    constructor(config = {}) {
        this.weights = { ...PerformanceMetricGenerator.DEFAULT_WEIGHTS, ...config };
    }

    /**
     * Synthesizes a unified trust metric based on recent operational performance data.
     * 
     * @param {string} actorId - The ID of the component being audited.
     * @param {Object} auditData - Aggregated data points for a specific actor.
     * @param {number} [auditData.complianceScore=1.0] - Ratio of successful policy checks (0 to 1).
     * @param {number} [auditData.violationCount=0] - Number of serious policy violations committed.
     * @param {number} [auditData.efficiencyScore=1.0] - Metric derived from operational metrics (e.g., inverted latency, low resource usage, 0 to 1).
     * @returns {number} The calculated performance metric between 0.0 and 1.0.
     */
    generateMetric(actorId, auditData) {
        // Default values ensure metric is calculated even if data is sparse, reflecting optimal performance.
        const {
            complianceScore = 1.0,
            violationCount = 0,
            efficiencyScore = 1.0
        } = auditData;

        let currentScore = this.weights.defaultBaseline;

        // 1. Violation Penalties (Immediate impact)
        // Penalties are subtracted directly from the baseline
        if (violationCount > 0) {
            currentScore += violationCount * this.weights.policyViolationPenalty; 
        }

        // 2. Compliance Score (Steady influence)
        // Adjust the baseline relative to how compliant the actor has been.
        currentScore = currentScore * complianceScore;

        // 3. Efficiency/Operational Data
        // The efficiencyScore should modulate the final result.
        // If efficiencyScore is 1, a positive delta is added. If 0, a negative delta is added.
        // Using (efficiencyScore - 0.5) ensures efficiency contributes positively when above 50% and negatively when below.
        currentScore += (efficiencyScore - 0.5) * this.weights.efficiencyDeltaContribution;
        
        // Final clamping and normalization required for TrustMatrixManager input
        return Math.max(0.0, Math.min(1.0, currentScore));
    }
}

module.exports = PerformanceMetricGenerator;