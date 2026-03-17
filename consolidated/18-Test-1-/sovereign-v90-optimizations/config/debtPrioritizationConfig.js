/**
 * Configuration constants for the Efficiency Debt Prioritizer (EDP).
 * These values dictate the strategic trade-off between impact gain and complexity/risk acceptance.
 *
 * NOTE: This configuration adheres to the MetricWeightConfigurationValidator schema,
 * ensuring weights are normalized and thresholds are within [0, 1].
 *
 * Optimized for synchronous, immutable export using an IIFE pattern.
 */
module.exports = Object.freeze((() => ({
    // --- EDP Scoring Weights (W) - Must sum to 1.0 ---

    /** High weight on potential performance improvements/savings. */
    IMPACT_WEIGHT: 0.70,

    /** Penalty for complexity, favoring refactors that require moderate effort if impact is high. */
    COMPLEXITY_PENALTY: 0.30,

    // --- EDP Safety Thresholds (M-02 Pre-Processor) - Must be in [0.0, 1.0] ---

    /** 
     * Maximum normalized risk (0.0 to 1.0) allowed for automated execution. 
     * Items exceeding this require manual review. 
     */
    RISK_THRESHOLD: 0.12,

    /** 
     * Minimum calculated score required for a proposal to be forwarded to the Global Strategic Execution Pipeline (GSEP). 
     */
    MIN_PRIORITY_TO_INJECT: 0.05,
}))());