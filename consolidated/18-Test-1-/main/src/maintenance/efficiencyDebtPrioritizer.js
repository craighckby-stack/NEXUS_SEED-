/**
 * src/maintenance/efficiencyDebtPrioritizer.js
 * Component ID: EDP (Efficiency Debt Prioritizer) - Optimized Kernel (K-EDP)
 * Role: Quantifies and prioritizes low-risk, high-impact maintenance tasks (Efficiency Debt)
 * using an optimized, recursive abstraction of the metric-weighted scoring function.
 */

// --- Abstraction Layer: Scoring Kernel ---

/**
 * The core recursive summation kernel for priority calculation.
 * Operates purely on provided metrics and weights, leveraging functional recursion (reduce).
 * Score = ∑ (Metric_N * Weight_N)
 * @param {Object} metrics - Normalized metric values (0.0 to 1.0).
 * @param {Object} weights - Configuration weights.
 * @returns {number} The calculated priority score.
 */
const ScoringKernel = (metrics, weights) => {
    // Utilizes Array.reduce for a single-pass summation abstraction over the weights.
    return Object.entries(weights).reduce((score, [metricKey, weight]) => {
        // Penalty metrics (negative weight) default to 1.0 (max penalty/effort) if missing.
        // Benefit metrics (positive weight) default to 0.0 (no impact) if missing.
        const isPenalty = weight < 0;
        const defaultValue = isPenalty ? 1.0 : 0.0;

        const metricValue = metrics[metricKey] !== undefined ? metrics[metricKey] : defaultValue;

        return score + (metricValue * weight);
    }, 0);
};

class EfficiencyDebtPrioritizer {

    static DEFAULT_CONFIG = {
        WEIGHTS: {
            savings_potential: 0.65,
            complexity: -0.35,
        },
        RISK_THRESHOLD: 0.15,
        DEFAULT_CONFIDENCE: 0.95,
    };

    /**
     * @param {Object} seaInterface - Interface to the Systemic Entropy Auditor (SEA).
     * @param {Object} [scoringConfig={}] - Overrides for the DEFAULT_CONFIG.
     */
    constructor(seaInterface, scoringConfig = {}) {
        if (!seaInterface || typeof seaInterface.getMetrics !== 'function') {
             throw new Error("EDP requires a valid SEA interface with auditing capabilities.");
        }

        this.sea = seaInterface;

        const W = EfficiencyDebtPrioritizer.DEFAULT_CONFIG.WEIGHTS;
        const SC_W = scoringConfig.WEIGHTS || {};

        // Deep merge configuration
        this.config = {
            ...EfficiencyDebtPrioritizer.DEFAULT_CONFIG,
            ...scoringConfig,
            WEIGHTS: { ...W, ...SC_W }
        };

        this.prioritizedQueue = [];

        // Memoize the scoring function reference for optimized runtime access
        this.priorityScorer = ScoringKernel;
    }

    /**
     * Ingests, filters, scores, and prioritizes debt artifacts in a single optimized pass.
     * This minimizes array traversal (O(N) iteration + O(N log N) sort).
     * @param {Array<Object>} debtArtifacts - List of structural debts.
     * @returns {Array<Object>} The newly sorted, prioritized debt queue.
     */
    ingestAndScoreDebt(debtArtifacts) {
        if (!Array.isArray(debtArtifacts)) {
            this.prioritizedQueue = [];
            return [];
        }

        const threshold = this.config.RISK_THRESHOLD;
        const weights = this.config.WEIGHTS;
        const scorer = this.priorityScorer;

        const scoredDebts = [];

        // Single pass optimization: Combines filter and map operations.
        for (const debt of debtArtifacts) {
            // M-02: Strict Risk Threshold Filter (Early exit for computational efficiency)
            if ((debt.risk_level || 1.0) > threshold) {
                continue;
            }

            const metrics = debt.metrics || {};

            // Apply the abstracted, pure scoring kernel
            const priority = scorer(metrics, weights);

            scoredDebts.push({
                ...debt,
                priority: priority,
                // Retain key impact score for quick proposal generation
                impactScore: metrics.savings_potential || 0.0 
            });
        }

        // Sort: Highest priority first (descending)
        this.prioritizedQueue = scoredDebts.sort((a, b) => b.priority - a.priority);

        return this.prioritizedQueue;
    }

    /**
     * Retrieves the top N debt items structured for GSEP intake.
     * @param {number} [n=5] - Number of proposals to generate.
     * @returns {Array<Object>} Optimized mutation proposals structured for GSEP intake.
     */
    getPrioritizedProposals(n = 5) {
        if (this.prioritizedQueue.length === 0) {
            return [];
        }

        const confidence = this.config.DEFAULT_CONFIDENCE;

        return this.prioritizedQueue.slice(0, n).map(item => ({
            type: 'EfficiencyMutation',
            source: 'EDP/v94.1_K', // Denotes use of the abstracted Scoring Kernel
            priority_score: item.priority,
            description: `[P${item.priority.toFixed(3)}] Refactoring Debt: ${item.description || 'Unnamed Efficiency Target'} (${(item.impactScore * 100).toFixed(1)}% Potential)`,
            target_file: item.target_file,
            scope_data: item.details,
            confidence: item.confidence || confidence
        }));
    }
}

module.exports = EfficiencyDebtPrioritizer;