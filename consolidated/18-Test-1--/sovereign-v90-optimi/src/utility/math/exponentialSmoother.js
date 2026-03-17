/**
 * @fileoverview Implements an Exponential Weighted Moving Average (EWMA) smoother.
 * This implementation acts as a proxy to the stateful EWMACalculatorTool plugin.
 * @module utility/math/exponentialSmoother
 */

const EWMACalculatorToolName = 'EWMACalculatorTool';

/**
 * ExponentialSmoother: Implements an Exponential Weighted Moving Average (EWMA).
 * This utility provides a stable, averaged signal (S_t) from noisy data (Y_t) using a configurable alpha factor (the smoothing constant).
 *
 * Formula: S_t = (alpha * Y_t) + ((1 - alpha) * S_{t-1})
 */
class ExponentialSmoother {
    /** @private {Object} The internal smoother instance provided by the plugin. */
    #smootherInstance;

    /**
     * @param {number} alpha - Smoothing factor (0 < alpha < 1). Lower alpha means more smoothing (slower response to change).
     * @param {number} [initialValue=0.0] - Starting value for the smoothed signal.
     */
    constructor(alpha, initialValue = 0.0) {
        // CRITICAL: Assuming a global tool factory is available for dependency injection.
        if (typeof KernelToolFactory === 'undefined' || !KernelToolFactory.getTool) {
            throw new Error("ExponentialSmoother requires KernelToolFactory to access EWMACalculatorTool.");
        }

        const tool = KernelToolFactory.getTool(EWMACalculatorToolName);
        
        if (!tool || typeof tool.execute !== 'function') {
             throw new Error(`Required plugin '${EWMACalculatorToolName}' not found or incorrectly initialized.`);
        }

        // The plugin handles all input validation and state initialization.
        this.#smootherInstance = tool.execute({
            alpha: alpha,
            initialValue: initialValue
        });
    }

    /**
     * Updates the smoothed value based on a new observation.
     * Ensures input is valid to maintain numerical stability.
     * @param {number} newValue - The new raw observed data point.
     * @returns {number} The updated smoothed value.
     * @throws {Error} If newValue is not a valid finite number (handled by the tool).
     */
    update(newValue) {
        return this.#smootherInstance.update(newValue);
    }

    /**
     * Gets the current stable smoothed value.
     * @returns {number}
     */
    get() {
        return this.#smootherInstance.get();
    }

    /**
     * Gets the number of data points processed so far.
     * @returns {number}
     */
    getCount() {
        return this.#smootherInstance.getCount();
    }
    
    /**
     * Resets the smoother state to its initial configured values.
     */
    reset() {
        this.#smootherInstance.reset();
    }
}

module.exports = ExponentialSmoother;