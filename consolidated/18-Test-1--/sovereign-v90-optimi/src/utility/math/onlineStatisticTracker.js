/**
 * @fileoverview Implements an online algorithm (Welford's method) for calculating
 * mean, variance, and standard deviation incrementally without storing all data points.
 * Provides O(1) performance per update.
 *
 * This class now acts as a wrapper delegating all functionality to the 
 * OnlineStatisticTrackerTool registered in the AGI kernel.
 */

// NOTE: We assume 'OnlineStatisticTrackerTool' is accessible in the execution context 
// (e.g., via module resolution or global kernel access) to satisfy the delegation requirement.

/**
 * @type {{create: () => any, reset: () => void, update: (v: number) => void, getMean: () => number, getVariance: () => number, getStandardDeviation: () => number, getCount: () => number}}
 * @ignore
 */
// @ts-ignore
const OnlineStatisticTrackerTool = require('OnlineStatisticTrackerTool');

class OnlineStatisticTracker {
    /**
     * @type {object}
     * @private
     * The instance managed by the core tool implementation.
     */
    _tracker;

    constructor() {
        this._tracker = OnlineStatisticTrackerTool.create();
    }

    /**
     * Resets all accumulated statistics.
     */
    reset() {
        this._tracker.reset();
    }

    /**
     * Updates the running statistics with a new data point.
     * @param {number} newValue - The new observation.
     * @throws {Error} If newValue is not a valid finite number (validation handled by the core tool).
     */
    update(newValue) {
        this._tracker.update(newValue);
    }

    /**
     * Gets the current arithmetic mean.
     * @returns {number}
     */
    getMean() {
        return this._tracker.getMean();
    }

    /**
     * Gets the current sample variance (n > 1) or 0 (n <= 1).
     * @returns {number}
     */
    getVariance() {
        return this._tracker.getVariance();
    }

    /**
     * Gets the current sample standard deviation.
     * @returns {number}
     */
    getStandardDeviation() {
        return this._tracker.getStandardDeviation();
    }

    /**
     * Gets the number of data points processed.
     * @returns {number}
     */
    getCount() {
        return this._tracker.getCount();
    }
}

module.exports = OnlineStatisticTracker;