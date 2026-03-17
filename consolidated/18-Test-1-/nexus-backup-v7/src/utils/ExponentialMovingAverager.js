/**
 * Utility for maintaining a stable Exponential Moving Average (EMA).
 * O(1) complexity for updates and retrieval, optimized for high-frequency telemetry/statistics.
 */
class ExponentialMovingAverager {
    #currentAverage = null;
    #alpha;
    #complementaryAlpha; // Stores (1 - alpha)
    #isInitialized = false;

    /**
     * @param {number} alpha - The smoothing factor (0.0 < alpha < 1.0). Lower is smoother, meaning older data has more weight.
     */
    constructor(alpha = 0.1) {
        if (typeof alpha !== 'number' || alpha <= 0 || alpha >= 1) {
            throw new Error("Alpha (smoothing factor) must be a number strictly between 0 and 1.");
        }
        
        this.#alpha = alpha;
        // Optimization: Pre-calculate the complementary factor.
        this.#complementaryAlpha = 1 - alpha;
    }

    /**
     * Updates the average with a new value.
     * @param {number} newValue 
     * @returns {number | null} The new calculated average.
     */
    update(newValue) {
        if (typeof newValue !== 'number' || isNaN(newValue)) {
            throw new TypeError("New value must be a valid number.");
        }

        if (!this.#isInitialized) {
            // First reading sets the initial average
            this.#currentAverage = newValue;
            this.#isInitialized = true;
        } else {
            // Optimized EMA calculation: 
            // Avg_t = (alpha * Value_t) + (complementaryAlpha * Avg_{t-1})
            this.#currentAverage = (this.#alpha * newValue) + (this.#complementaryAlpha * this.#currentAverage);
        }
        return this.#currentAverage;
    }

    /**
     * Retrieves the current average using a modern property getter.
     * @returns {number | null} The current average, or null if no values have been processed.
     */
    get average() {
        return this.#currentAverage;
    }

    /**
     * Checks if the averager has received any data points yet.
     * @returns {boolean}
     */
    get isInitialized() {
        return this.#isInitialized;
    }

    /**
     * Resets the averager state, allowing it to begin calculation fresh upon the next update.
     */
    reset() {
        this.#currentAverage = null;
        this.#isInitialized = false;
    }
}

module.exports = ExponentialMovingAverager;
