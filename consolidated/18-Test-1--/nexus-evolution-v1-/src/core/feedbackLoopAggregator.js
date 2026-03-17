/**
 * src/core/feedbackLoopAggregator.js
 *
 * Purpose: Standardizes and aggregates metrics derived from the Consensus Layer 
 * to ensure accurate learning (ATM recalibration and SIC updates).
 * This component is the formalized link between critique and execution/learning.
 */
class FeedbackLoopAggregator {
    constructor() {
        this.consensusLog = [];
    }

    /**
     * Captures and validates the outcome of a single proposal validation cycle.
     * @param {Object} outcomeData - Contains proposal ID, success status, applied MCRA threshold, final weighted ATM score, and resulting architecture delta.
     */
    captureConsensusOutcome(outcomeData) {
        if (!outcomeData || typeof outcomeData.success === 'undefined') {
            console.error("Invalid outcome data provided to Aggregator.");
            return;
        }
        
        // Structure the data for efficient ATM recalibration and SIC pattern analysis
        const record = {
            timestamp: Date.now(),
            proposalId: outcomeData.proposalId,
            success: outcomeData.success,
            riskScore_MCRA: outcomeData.mcraScore,
            confidenceScore_ATM: outcomeData.finalAtmScore,
            agentWeightDeltas: outcomeData.agentWeights // Used for immediate recalibration
        };
        
        this.consensusLog.push(record);
        this.processForLearning(record);
    }
    
    /**
     * Immediately feeds the structured record into the ATM and SIC systems.
     * @param {Object} record - The validated feedback record.
     */
    processForLearning(record) {
        // 1. Trigger ATM System Update (recalibration based on record.success)
        // 2. Trigger SIC Analysis (check if success criteria meets abstraction threshold)
    }

    getHistoricalMetrics() {
        return this.consensusLog;
    }
}

module.exports = FeedbackLoopAggregator;