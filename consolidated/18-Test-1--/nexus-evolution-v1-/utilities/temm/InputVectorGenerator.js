/**
 * InputVectorGenerator: Responsible for gathering, processing, and normalizing 
 * raw subsystem metrics into the standardized GHS_score, RES_score, and SRS_score vectors 
 * required by the EfficacyAggregator.
 * 
 * This acts as the necessary upstream component, ensuring the Aggregator receives 
 * properly calibrated and bounded [0.0, 1.0] inputs.
 */

class InputVectorGenerator {
    /**
     * @param {Object} subsystemMetrics - Raw data feed from Governance, Resilience, and Safety subsystems.
     */
    constructor(subsystemMetrics) {
        this.metrics = subsystemMetrics;
    }

    /**
     * Processes raw data into normalized TEMM vectors.
     * @returns {Object} { GHS_score: number, RES_score: number, SRS_score: number }
     */
    generate() {
        const GHS_score = this.#calculateGHS(this.metrics.governance);
        const RES_score = this.#calculateRES(this.metrics.resilience);
        const SRS_score = this.#calculateSRS(this.metrics.safety);

        // Using modern property value shorthand
        return {
            GHS_score,
            RES_score,
            SRS_score
        };
    }

    /**
     * Ensures the score is strictly bounded between 0.0 and 1.0.
     * @param {number} value
     * @returns {number}
     */
    #normalize(value) {
        return Math.min(1.0, Math.max(0.0, value));
    }

    #calculateGHS(data) {
        // Example: Normalize Governance Health Score (GHS) based on policy adherence and drift.
        // We rely on #normalize to handle potential inputs outside [0, 1].
        return this.#normalize(data.adherenceRate);
    }

    #calculateRES(data) {
        // Example: Calculate Resilience Score (RES) based on failure recovery time normalized.
        // If recoveryTime exceeds maxExpectedTime, the raw score is negative, which #normalize handles.
        const rawScore = 1.0 - (data.recoveryTime / data.maxExpectedTime);
        return this.#normalize(rawScore);
    }

    #calculateSRS(data) {
        // Example: Calculate Safety Risk Score (SRS) based on recent near-miss frequency (inverted).
        // Lower risk -> higher SRS score. Using 100 as the defined maximum threshold.
        const MAX_NEAR_MISSES_THRESHOLD = 100;
        const rawScore = 1.0 - (data.recentNearMisses / MAX_NEAR_MISSES_THRESHOLD);
        return this.#normalize(rawScore);
    }
}

module.exports = InputVectorGenerator;