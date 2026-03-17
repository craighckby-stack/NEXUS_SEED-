const ExponentialMovingAverager = require('./ExponentialMovingAverager');

/**
 * A central manager for multiple Averager instances, primarily utilizing Exponential Moving Averages 
 * for tracking system metrics (e.g., latency, throughput, resource usage).
 * 
 * Enhancements include: Improved encapsulation, validation, and usage of modern JS features.
 */
class AveragingManager {
    /**
     * @param {number} [defaultAlpha=0.1] - The smoothing factor (0 to 1) used for new EMAs created without a specific alpha value.
     */
    constructor(defaultAlpha = 0.1) {
        /** @private @type {Map<string, ExponentialMovingAverager>} */
        this._averagers = new Map();
        /** @private @type {number} */
        this._defaultAlpha = defaultAlpha;

        if (defaultAlpha <= 0 || defaultAlpha >= 1) {
             // Providing a warning for potentially unintended behavior
             console.warn("AveragingManager initialized with an extreme alpha value. Recommended range: (0, 1).");
        }
    }

    /**
     * Retrieves an existing averager or creates a new one using ExponentialMovingAverager.
     * Note: If the averager exists, subsequent calls supplying a new alpha will be ignored.
     * @param {string} key - The unique identifier for the metric.
     * @param {number} [alpha=this._defaultAlpha] - Optional alpha smoothing factor for this specific averager (only used on creation).
     * @returns {ExponentialMovingAverager}
     */
    getAverager(key, alpha = this._defaultAlpha) {
        if (!this._averagers.has(key)) {
            // Use the provided alpha if valid, otherwise fall back to the manager's default.
            const effectiveAlpha = (typeof alpha === 'number' && alpha > 0 && alpha < 1) ? alpha : this._defaultAlpha;
            const newAverager = new ExponentialMovingAverager(effectiveAlpha);
            this._averagers.set(key, newAverager);
        }
        return this._averagers.get(key);
    }

    /**
     * Updates a specific metric with a new value.
     * Automatically creates the averager if necessary using the default alpha.
     * @param {string} key - The identifier for the metric.
     * @param {number} value - The new value for the average calculation. Must be a number.
     * @returns {number | null} The new calculated average, or null if the input value is invalid.
     */
    update(key, value) {
        if (typeof value !== 'number' || isNaN(value)) {
            // Robustness: Ignore non-numeric updates, returning current state.
            return this.getAverage(key); 
        }
        
        const averager = this.getAverager(key);
        return averager.update(value);
    }

    /**
     * Retrieves the current average for a specific metric key.
     * @param {string} key - The identifier for the metric.
     * @returns {number | null} The current average, or null if the key doesn't exist or hasn't initialized an average yet.
     */
    getAverage(key) {
        const averager = this._averagers.get(key);
        return averager ? averager.average : null;
    }

    /**
     * Retrieves all tracked averages as a structured object.
     * @returns {Object.<string, number | null>} Map of metric keys to their current averages.
     */
    getAllAverages() {
        // Uses modern JS Object.fromEntries for concise map transformation.
        return Object.fromEntries(
            [...this._averagers.entries()].map(([key, averager]) => [key, averager.average])
        );
    }

    /**
     * Resets a single specific averager, or all averagers if no key is provided.
     * @param {string} [key] - Optional key to reset a specific averager.
     * @returns {void}
     */
    reset(key) {
        if (key) {
            // Use optional chaining for safe access and execution.
            this._averagers.get(key)?.reset(); 
        } else {
            this._averagers.forEach(a => a.reset());
        }
    }
}

module.exports = AveragingManager;