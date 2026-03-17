/**
 * src/governance/PerformanceMetricGenerator.js
 * Purpose: Calculates a standardized performance metric [0.0, 1.0] by applying weighted penalties
 * to deviations from optimal audit metrics (1.0). This metric feeds into the Trust Matrix.
 * 
 * The calculation is based on weighted subtractions from a perfect score (1.0), ensuring
 * clear governance control over the impact of non-compliance and inefficiency.
 */
class PerformanceMetricGenerator {
    
    /**
     * Standard configuration for governing the impact of audit data deviations.
     * Weights represent the maximum impact on the final score (0.0 to 1.0) for a full deviation.
     */
    static DEFAULT_WEIGHTS = {
        // Max negative impact if complianceScore is 0.0 (e.g., score reduction of up to 0.4)
        COMPLIANCE_DEVIATION_WEIGHT: 0.4,
        
        // Max negative impact if efficiencyScore is 0.0 (e.g., score reduction of up to 0.3)
        EFFICIENCY_DEVIATION_WEIGHT: 0.3,
        
        // Fixed deduction applied per discrete policy violation instance
        POLICY_VIOLATION_PENALTY: 0.15
    };

    /**
     * @param {Object} [config={}] - Optional configuration overrides for weight distribution.
     */
    constructor(config = {}) {
        this.weights = { ...PerformanceMetricGenerator.DEFAULT_WEIGHTS, ...config };
    }

    /**
     * Validates input audit data required for metric generation.
     * @private
     * @param {Object} data - Audit data.
     */
    _validateAuditData(data) {
        const { complianceScore, violationCount, efficiencyScore } = data;

        if (typeof complianceScore !== 'number' || complianceScore < 0 || complianceScore > 1) {
            throw new Error("Invalid complianceScore: Must be between 0.0 and 1.0.");
        }
        if (typeof efficiencyScore !== 'number' || efficiencyScore < 0 || efficiencyScore > 1) {
            throw new Error("Invalid efficiencyScore: Must be between 0.0 and 1.0.");
        }
        if (typeof violationCount !== 'number' || violationCount < 0 || !Number.isInteger(violationCount)) {
            throw new Error("Invalid violationCount: Must be a non-negative integer.");
        }
    }

    /**
     * Synthesizes a unified trust metric based on recent operational performance data.
     * 
     * @param {string} actorId - The ID of the component being audited.
     * @param {Object} auditData - Aggregated and normalized data points for a specific actor.
     * @param {number} [auditData.complianceScore=1.0] - Ratio of successful policy checks (0 to 1).
     * @param {number} [auditData.violationCount=0] - Number of serious policy violations committed.
     * @param {number} [auditData.efficiencyScore=1.0] - Normalized operational metric (0 to 1).
     * @returns {number} The calculated performance metric between 0.0 and 1.0.
     */
    generateMetric(actorId, auditData) {
        
        const {
            complianceScore = 1.0,
            violationCount = 0,
            efficiencyScore = 1.0
        } = auditData;

        this._validateAuditData({ complianceScore, violationCount, efficiencyScore });
        
        // Start at optimal score (1.0)
        let currentScore = 1.0;

        // --- Weighted Deviation Penalties ---

        // 1. Compliance Deviation (Deviation = 1.0 - score)
        const complianceDeviation = 1.0 - complianceScore;
        currentScore -= complianceDeviation * this.weights.COMPLIANCE_DEVIATION_WEIGHT;

        // 2. Efficiency Deviation
        const efficiencyDeviation = 1.0 - efficiencyScore;
        currentScore -= efficiencyDeviation * this.weights.EFFICIENCY_DEVIATION_WEIGHT;

        // --- Discrete Event Penalties ---

        // 3. Violation Penalties (Hard deduction per instance)
        currentScore -= violationCount * this.weights.POLICY_VIOLATION_PENALTY;

        // Final clamping and normalization required for TrustMatrixManager input
        return Math.max(0.0, Math.min(1.0, currentScore));
    }
}

module.exports = PerformanceMetricGenerator;