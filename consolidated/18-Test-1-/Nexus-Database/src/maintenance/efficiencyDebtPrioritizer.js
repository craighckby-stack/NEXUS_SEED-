/**
 * src/maintenance/efficiencyDebtPrioritizer.js
 * Component ID: EDP (Efficiency Debt Prioritizer)
 * Role: Quantifies and prioritizes low-risk, high-impact maintenance tasks (Efficiency Debt)
 * using a highly configurable, metric-weighted scoring function.
 */

class EfficiencyDebtPrioritizer {
    
    /**
     * Standard default configuration template.
     * Weights are used to define the contribution of normalized metrics (0.0 to 1.0).
     * Positive weights indicate impact/benefit; negative weights indicate effort/penalty.
     */
    static DEFAULT_CONFIG = {
        WEIGHTS: {
            savings_potential: 0.65, // Positive Impact Metric
            complexity: -0.35,       // Negative Effort/Penalty Metric
            // Future metrics can be added here (e.g., maintenance_index_delta: 0.1)
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
        
        // Deep merge configuration to preserve specific weight overrides
        this.config = {
            ...EfficiencyDebtPrioritizer.DEFAULT_CONFIG,
            ...scoringConfig,
            WEIGHTS: {
                ...EfficiencyDebtPrioritizer.DEFAULT_CONFIG.WEIGHTS,
                ...(scoringConfig.WEIGHTS || {})
            }
        };
        
        this.prioritizedQueue = [];
    }

    /**
     * Calculates the overall priority score by summing weighted normalized metrics.
     * Score = ∑ (Metric_N * Weight_N)
     * Assumes all input metrics are pre-normalized (0.0 to 1.0) by an upstream utility.
     * @param {Object} metrics - Key-value pair of normalized metrics.
     * @returns {number} Priority score (higher is better; can be negative).
     */
    _calculatePriorityScore(metrics) {
        let score = 0;
        const weights = this.config.WEIGHTS;
        
        for (const [metricKey, weight] of Object.entries(weights)) {
            // Fallback strategy: If a metric is missing, assume 0 impact (0.0) or maximum penalty (1.0).
            // This improves robustness against incomplete upstream data.
            const isPenaltyMetric = weight < 0;
            const defaultValue = isPenaltyMetric ? 1.0 : 0.0;
            
            const metricValue = metrics[metricKey] || defaultValue;
            
            score += metricValue * weight;
        }
        
        return score;
    }

    /**
     * Ingests, filters, scores, and prioritizes debt artifacts.
     * Updates the internal prioritization queue state.
     * @param {Array<Object>} debtArtifacts - List of structural debts. Each must contain 'metrics' and 'risk_level'.
     * @returns {Array<Object>} The newly sorted, prioritized debt queue.
     */
    ingestAndScoreDebt(debtArtifacts) {
        if (!Array.isArray(debtArtifacts)) {
            console.warn("EDP: Received non-array input for scoring. Queue reset.");
            this.prioritizedQueue = [];
            return [];
        }

        const scoredDebts = debtArtifacts
            // Stage M-02: Strict Risk Threshold Filter (low risk first)
            .filter(debt => (debt.risk_level || 1.0) <= this.config.RISK_THRESHOLD)
            .map(debt => {
                const metrics = debt.metrics || {};
                
                return {
                    ...debt,
                    // Dynamically calculate priority using all configured weights
                    priority: this._calculatePriorityScore(metrics),
                    impactScore: metrics.savings_potential || 0.0 // Retain a key impact score for quick reference
                };
            });

        // Sort: Highest priority first (descending)
        this.prioritizedQueue = scoredDebts.sort((a, b) => b.priority - a.priority);
        return this.prioritizedQueue;
    }

    /**
     * Retrieves the top N debt items structured for GSEP intake.
     * Includes calculated priority score in the proposal description.
     * @param {number} [n=5] - Number of proposals to generate.
     * @returns {Array<Object>} Optimized mutation proposals structured for GSEP intake.
     */
    getPrioritizedProposals(n = 5) {
        if (this.prioritizedQueue.length === 0) {
            return [];
        }
        
        return this.prioritizedQueue.slice(0, n).map(item => ({
            type: 'EfficiencyMutation',
            source: 'EDP/v94.1',
            priority_score: item.priority,
            description: `[P${item.priority.toFixed(3)}] Refactoring Debt: ${item.description || 'Unnamed Efficiency Target'} (${(item.impactScore * 100).toFixed(1)}% Potential)`,
            target_file: item.target_file,
            scope_data: item.details,
            confidence: item.confidence || this.config.DEFAULT_CONFIDENCE
        }));
    }
}

module.exports = EfficiencyDebtPrioritizer;