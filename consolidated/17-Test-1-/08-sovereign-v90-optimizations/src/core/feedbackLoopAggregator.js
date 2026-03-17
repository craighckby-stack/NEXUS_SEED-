/**
 * src/core/feedbackLoopAggregatorKernel.js
 *
 * Purpose: Standardizes and aggregates metrics derived from the Consensus Layer 
 * to ensure accurate learning (ATM recalibration and SIC updates).
 * This component is the formalized link between critique and execution/learning.
 */

// Conceptual Interfaces (for reference, assumed to be globally available or imported)
// interface FeedbackRecord { ... }
// interface OutcomeData { ... }
// interface IFeedbackDataNormalizerToolKernel { normalize(data: OutcomeData): { error?: string, record?: FeedbackRecord }; }
// interface ILoggerToolKernel { error(message: string, ...args: any[]): void; }

class FeedbackLoopAggregatorKernel {
    #consensusLog;
    #normalizer;
    #logger;

    /**
     * @param {object} dependencies - Dependencies injected via DI container.
     * @param {IFeedbackDataNormalizerToolKernel} dependencies.normalizer - Responsible for data validation and normalization.
     * @param {ILoggerToolKernel} dependencies.logger - Logging facility.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
        this.#consensusLog = [];
    }

    /**
     * Isolates dependency assignment and validation.
     * @param {object} dependencies
     */
    #setupDependencies({ normalizer, logger }) {
        if (!normalizer || typeof normalizer.normalize !== 'function') {
            throw new Error("[FeedbackLoopAggregatorKernel] Requires a valid IFeedbackDataNormalizerToolKernel instance with a 'normalize' method.");
        }
        if (!logger || typeof logger.error !== 'function') {
            // Assuming ILoggerToolKernel implements at least 'error'
            throw new Error("[FeedbackLoopAggregatorKernel] Requires a valid ILoggerToolKernel instance.");
        }
        this.#normalizer = normalizer;
        this.#logger = logger;
    }

    /**
     * Captures and validates the outcome of a single proposal validation cycle.
     * Validation and normalization logic is delegated to the injected Normalizer.
     * @param {OutcomeData} outcomeData - Contains proposal ID, success status, applied MCRA threshold, final weighted ATM score, and resulting architecture delta.
     */
    captureConsensusOutcome(outcomeData) {

        const normalizationResult = this.#normalizer.normalize(outcomeData);

        if (normalizationResult.error || !normalizationResult.record) {
            this.#logger.error(`Invalid outcome data provided to Aggregator. Error: ${normalizationResult.error || 'Normalization failed.'}`, { outcomeData });
            return;
        }

        const record = normalizationResult.record;

        this.#consensusLog.push(record);
        this.processForLearning(record);
    }

    /**
     * Immediately feeds the structured record into the ATM and SIC systems.
     * @param {FeedbackRecord} record - The validated feedback record.
     */
    processForLearning(record) {
        // 1. Trigger ATM System Update (recalibration based on record.success)
        // 2. Trigger SIC Analysis (check if success criteria meets abstraction threshold)
        // NOTE: Future refinement will involve injecting specific ATM/SIC trigger kernels here.
    }

    getHistoricalMetrics() {
        return this.#consensusLog;
    }
}

module.exports = FeedbackLoopAggregatorKernel;
