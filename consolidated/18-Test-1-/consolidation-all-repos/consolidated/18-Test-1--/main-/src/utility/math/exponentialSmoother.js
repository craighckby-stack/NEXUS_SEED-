/**
 * @fileoverview Implements an Exponential Weighted Moving Average (EWMA) smoother.
 * @module utility/math/exponentialSmoother
 */

/**
 * ExponentialSmoother: Implements an Exponential Weighted Moving Average (EWMA).
 * This utility provides a stable, averaged signal (S_t) from noisy data (Y_t) using a configurable alpha factor (the smoothing constant).
 * 
 * Formula: S_t = (alpha * Y_t) + ((1 - alpha) * S_{t-1})
 */
class ExponentialSmoother {
    /**
     * @param {number} alpha - Smoothing factor (0 < alpha < 1). Lower alpha means more smoothing (slower response to change).
     * @param {number} [initialValue=0.0] - Starting value for the smoothed signal.
     */
    constructor(alpha, initialValue = 0.0) {
        if (typeof alpha !== 'number' || alpha <= 0 || alpha >= 1 || isNaN(alpha)) {
            throw new Error("ExponentialSmoother: Alpha must be a number between 0 and 1 (exclusive).");
        }
        
        if (typeof initialValue !== 'number' || isNaN(initialValue) || !isFinite(initialValue)) {
            throw new Error("ExponentialSmoother: Initial value must be a finite number.");
        }

        this.alpha = alpha;
        this.complementAlpha = 1 - alpha; // Pre-calculate 1 - alpha for efficiency
        
        // Internal state
        this.initialValue = initialValue;
        this.smoothedValue = initialValue;
        this.count = 0;
    }

    /**
     * Updates the smoothed value based on a new observation.
     * Ensures input is valid to maintain numerical stability.
     * @param {number} newValue - The new raw observed data point.
     * @returns {number} The updated smoothed value.
     * @throws {Error} If newValue is not a valid finite number.
     */
    update(newValue) {
        if (typeof newValue !== 'number' || isNaN(newValue) || !isFinite(newValue)) {
            throw new Error(`ExponentialSmoother: Input value must be a valid finite number. Received: ${newValue}`);
        }

        // Formula: S_t = (alpha * Y_t) + (complementAlpha * S_{t-1})
        this.smoothedValue = 
            (this.alpha * newValue) + (this.complementAlpha * this.smoothedValue);
        
        this.count++;
        return this.smoothedValue;
    }

    /**
     * Gets the current stable smoothed value.
     * @returns {number}
     */
    get() {
        return this.smoothedValue;
    }

    /**
     * Gets the number of data points processed so far.
     * @returns {number}
     */
    getCount() {
        return this.count;
    }
    
    /**
     * Resets the smoother state to its initial configured values.
     */
    reset() {
        this.smoothedValue = this.initialValue;
        this.count = 0;
    }
}

module.exports = ExponentialSmoother;