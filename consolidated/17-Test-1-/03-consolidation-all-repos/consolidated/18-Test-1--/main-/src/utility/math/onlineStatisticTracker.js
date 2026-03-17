/**
 * @fileoverview Implements an online algorithm (Welford's method) for calculating
 * mean, variance, and standard deviation incrementally without storing all data points.
 * Provides O(1) performance per update.
 */
class OnlineStatisticTracker {
    constructor() {
        this.reset();
    }

    /**
     * Resets all accumulated statistics.
     */
    reset() {
        this.count = 0;
        this.mean = 0;
        this.M2 = 0; // Sum of squares of differences from the current mean
    }

    /**
     * Updates the running statistics with a new data point.
     * @param {number} newValue - The new observation.
     * @throws {Error} If newValue is not a valid finite number.
     */
    update(newValue) {
        if (typeof newValue !== 'number' || isNaN(newValue) || !isFinite(newValue)) {
            throw new Error(`OnlineStatisticTracker: Input value must be a valid finite number. Received: ${newValue}`);
        }

        this.count++;
        
        // Welford's Algorithm Step 1: calculate difference from old mean
        const delta = newValue - this.mean;
        
        // Welford's Algorithm Step 2: update mean
        this.mean += delta / this.count;
        
        // Welford's Algorithm Step 3: calculate difference from new mean and update M2
        const delta2 = newValue - this.mean;
        this.M2 += delta * delta2;
    }

    /**
     * Gets the current arithmetic mean.
     * @returns {number}
     */
    getMean() {
        return this.mean;
    }

    /**
     * Gets the current sample variance (n > 1) or 0 (n <= 1).
     * @returns {number}
     */
    getVariance() {
        if (this.count < 2) {
            return 0;
        }
        // Sample variance: M2 / (n - 1)
        return this.M2 / (this.count - 1); 
    }

    /**
     * Gets the current sample standard deviation.
     * @returns {number}
     */
    getStandardDeviation() {
        return Math.sqrt(this.getVariance());
    }

    /**
     * Gets the number of data points processed.
     * @returns {number}
     */
    getCount() {
        return this.count;
    }
}

module.exports = OnlineStatisticTracker;