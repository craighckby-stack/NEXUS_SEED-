/**
 * Proposal Metrics Engine (PME) v94.3 - Enhanced Bayesian-Temporal Core
 * Responsible for consuming aggregated data from PSHI (Proposal History Index) and outputting
 * actionable metrics for ARCH-ATM trust score calibration and AGI-C-12 CIW refinement.
 * Implements a strict three-stage calculation pipeline, leveraging segmented scoring and
 * configurable contextual Bayesian regression toward the mean (BTA).
 */
class ProposalMetricsEngine {

    static get DEFAULT_CONFIG() {
        return {
            // Weights for blending raw rate and recent performance (must sum close to 1.0)
            performanceWeights: { rawRate: 0.70, recentDecayWeight: 0.30 },
            // Factors for Bayesian Temporal Adjustment (BTA) Volume Normalization
            volumeNormalization: {
                minProposals: 15, // Minimum data required before applying full normalization
                maxConfidenceProportion: 0.6, // The proportion of MaxHistorySize needed for 1.0 confidence
                confidenceNeutralPoint: 0.5 // Default prior belief
            },
            // Context Multipliers and Risk Weights
            contextWeights: {
                "CRITICAL_SYSTEM": 1.75, // Increased penalty/reward weight
                "UTILITY_ADAPTER": 1.0,
                "UI_RENDER": 0.8
            },
            // Criticality penalty refinement for low scores in high-risk contexts
            criticalityPenalty: {
                threshold: 0.6,
                exponentFactor: 3.0 // Increased exponential dampening factor
            }
        };
    }

    constructor(historyIndexInstance, config = {}) {
        if (!historyIndexInstance || typeof historyIndexInstance.calculateAgentSuccessRate !== 'function') {
            throw new Error("PME requires a valid ProposalHistoryIndex (PSHI) instance.");
        }

        this.index = historyIndexInstance;
        this.config = Object.assign({}, ProposalMetricsEngine.DEFAULT_CONFIG, config);
        
        // Merge nested objects specifically
        this.config.performanceWeights = Object.assign({}, ProposalMetricsEngine.DEFAULT_CONFIG.performanceWeights, config.performanceWeights);
        this.config.volumeNormalization = Object.assign({}, ProposalMetricsEngine.DEFAULT_CONFIG.volumeNormalization, config.volumeNormalization);
        this.config.contextWeights = Object.assign({}, ProposalMetricsEngine.DEFAULT_CONFIG.contextWeights, config.contextWeights);
        this.config.criticalityPenalty = Object.assign({}, ProposalMetricsEngine.DEFAULT_CONFIG.criticalityPenalty, config.criticalityPenalty);

        // Validate weights post-merge
        const sum = this.config.performanceWeights.rawRate + this.config.performanceWeights.recentDecayWeight;
        if (Math.abs(sum - 1.0) > 0.01) {
            console.warn(`PME Performance weights sum to ${sum}, not 1.0. Results may be skewed.`);
        }
    }

    /**
     * Calculates the time-decayed and context-weighted trust score for an agent (ARCH-ATM output).
     * Follows the BTA Pipeline: 1. Temporal Blend, 2. Volume Confidence (Bayesian Regression), 3. Context Modulation.
     * @param {string} agentId - The agent identifier.
     * @param {string} currentContext - The context of the proposal being evaluated.
     * @returns {number} Calibrated Trust Score (0.01 to 1.0).
     */
    getCalibratedAgentTrustScore(agentId, currentContext) {
        const snapshot = this.index.calculateAgentSuccessRate(agentId);
        const cfg = this.config;

        if (snapshot.totalProposals < cfg.volumeNormalization.minProposals) {
            // Insufficient data: Apply mild confidence nudge based on initial raw rate
            const rawConfidenceAdjustment = (snapshot.rawRate - cfg.volumeNormalization.confidenceNeutralPoint) * 0.5;
            return Math.min(1.0, Math.max(0.01, cfg.volumeNormalization.confidenceNeutralPoint + rawConfidenceAdjustment));
        }

        // Stage 1: Temporal Blend
        let trustScore = this._calculateTemporalBlend(snapshot);

        // Stage 2: Volume Confidence Normalization (BTA)
        trustScore = this._applyVolumeNormalization(trustScore, snapshot);

        // Stage 3: Contextual Modulation and Risk Penalty
        trustScore = this._applyContextModulation(trustScore, currentContext);

        // Final Clamp (Ensures 0.01 floor to prevent immediate blacklisting)
        return Math.min(1.0, Math.max(0.01, trustScore));
    }

    /**
     * Stage 1: Blends raw historical success rate with the recent, time-decayed performance.
     * @private
     */
    _calculateTemporalBlend(snapshot) {
        const { performanceWeights } = this.config;
        return (
            (performanceWeights.rawRate * snapshot.rawRate) +
            (performanceWeights.recentDecayWeight * snapshot.recentWeight)
        );
    }

    /**
     * Stage 2: Pulls the score towards the confidence neutral point (0.5) if history is insufficient.
     * Implements Bayesian Temporal Adjustment (BTA).
     * @private
     */
    _applyVolumeNormalization(score, snapshot) {
        const { volumeNormalization } = this.config;
        const maxProposals = this.index.maxHistorySize;
        
        // Normalized volume ratio relative to max storage capacity
        const normalizedVolume = snapshot.totalProposals / maxProposals;
        
        // Confidence factor scales from 0 to 1 based on volume vs target proportion
        const confidenceFactor = Math.min(1.0, normalizedVolume / volumeNormalization.maxConfidenceProportion);
        
        // Bayesian Regression: Moves score toward the neutral prior based on confidence
        const deviationFromNeutral = score - volumeNormalization.confidenceNeutralPoint;
        return volumeNormalization.confidenceNeutralPoint + (deviationFromNeutral * confidenceFactor);
    }

    /**
     * Stage 3: Applies contextual risk weights and enhanced criticality penalties.
     * @private
     */
    _applyContextModulation(score, currentContext) {
        const cfg = this.config;
        const contextMultiplier = cfg.contextWeights[currentContext] || 1.0;
        let trustScore = score;

        if (contextMultiplier !== 1.0) {
            const deviationFromNeutral = trustScore - 0.5;
            // Amplify the deviation
            trustScore = 0.5 + (deviationFromNeutral * contextMultiplier);
            
            // Criticality Dampening (Non-linear Penalty Application)
            if (contextMultiplier > 1.0 && trustScore < cfg.criticalityPenalty.threshold) {
                const penaltyFactor = contextMultiplier - 1.0; // Severity based on criticality weight
                // Apply exponential penalty: higher penalty for scores further below the threshold
                const deltaBelowThreshold = cfg.criticalityPenalty.threshold - trustScore;
                const criticalityPenalty = penaltyFactor * Math.pow(deltaBelowThreshold, cfg.criticalityPenalty.exponentFactor);
                trustScore -= criticalityPenalty;
            }
        }
        return trustScore;
    }

    /**
     * Retrieves dynamic weighting adjustments for CIW inputs based on global failure patterns.
     * @param {string} topologyType - The structural failure signature.
     * @returns {number} Dynamic Weight Multiplier (>= 1.0).
     */
    getDynamicCIWAdjustments(topologyType) {
        // PSHI provides the normalized historical frequency of failures for this topology type [0, 1].
        const bias = this.index.getFailurePatternBias(topologyType);
        
        // Enhanced Scaling: Quadratic function [1.0, 5.0] range for significant emphasis on high-risk topologies.
        return 1.0 + (bias * bias * 4.0); 
    }
}

module.exports = ProposalMetricsEngine;