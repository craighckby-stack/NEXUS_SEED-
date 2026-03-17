/**
 * Utility for maintaining a stable Exponential Moving Average (EMA).
 * O(1) complexity for updates and retrieval, optimized for high-frequency telemetry/statistics.
 */
export class ExponentialMovingAverager {
    #currentAverage: number | null = null;
    #alpha: number;
    #complementaryAlpha: number; // Stores (1 - alpha)
    #isInitialized: boolean = false;

    /**
     * @param {number} [alpha=0.1] - The smoothing factor (0.0 < alpha < 1.0). Lower is smoother, meaning older data has more weight.
     */
    constructor(alpha: number = 0.1) {
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
    update(newValue: number): number | null {
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
            // We assert #currentAverage is a number since #isInitialized is true.
            this.#currentAverage = (this.#alpha * newValue) + (this.#complementaryAlpha * (this.#currentAverage as number));
        }
        return this.#currentAverage;
    }

    /**
     * Retrieves the current average.
     * @returns {number | null} The current average, or null if no values have been processed.
     */
    get average(): number | null {
        return this.#currentAverage;
    }

    /**
     * Checks if the averager has received any data points yet.
     * @returns {boolean}
     */
    get isInitialized(): boolean {
        return this.#isInitialized;
    }

    /**
     * Resets the averager state, allowing it to begin calculation fresh upon the next update.
     */
    reset(): void {
        this.#currentAverage = null;
        this.#isInitialized = false;
    }
}

export default ExponentialMovingAverager;
