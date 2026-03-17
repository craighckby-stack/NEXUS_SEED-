/**
 * AGI-KERNEL v7.11.3 [STRATEGIC_AGENCY]
 * Kernel Component ID: SEVK
 * Name: Statistical Evaluator Kernel
 * Function: Provides asynchronous interfaces for high-efficiency statistical functions
 *           required by the Adaptive Parameter Tuner. Adheres to Maximum Recursive Abstraction
 *           by delegating all computation to the IMaturityMetricDeriverToolKernel.
 */

const { IMaturityMetricDeriverToolKernel } = require('ACTIVE_TOOLS');

class StatisticalEvaluatorKernel {
    /**
     * @param {{maturityMetricDeriverKernel: IMaturityMetricDeriverToolKernel}} dependencies
     */
    constructor({ maturityMetricDeriverKernel }) {
        if (!maturityMetricDeriverKernel || typeof maturityMetricDeriverKernel.calculateVolatility !== 'function') {
            throw new Error('SEVK_INIT_ERROR: IMaturityMetricDeriverToolKernel dependency is required for statistical delegation.');
        }
        this._MMDK = maturityMetricDeriverKernel;
        this.interfaceName = 'StatisticalEvaluatorKernel';
    }

    /**
     * Enforces AIA mandate for asynchronous initialization.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Note: _MMDK is assumed to be initialized externally or handles its own lifecycle.
        // No further asynchronous initialization needed for this abstraction layer.
    }

    /**
     * Calculates the standard deviation of a dataset (proxy for metric volatility) asynchronously.
     * Delegates calculation entirely to the specialized IMaturityMetricDeriverToolKernel.
     * @param {Array<number>} data - Array of recent metric observations.
     * @returns {Promise<number>} The standard deviation.
     */
    async calculateVolatility(data) {
        // Maximum Recursive Abstraction: Delegate complex computation
        return await this._MMDK.calculateVolatility(data);
    }

    /**
     * Determines the short-term trend direction based on a linear regression slope asynchronously.
     * Delegates calculation entirely to the specialized IMaturityMetricDeriverToolKernel.
     * @param {Array<{ value: number, timestamp: number }>} observations - Array of { value: number, timestamp: number } objects.
     * @returns {Promise<number>} The slope of the trend.
     */
    async calculateTrendSlope(observations) {
        // Maximum Recursive Abstraction: Delegate complex computation
        return await this._MMDK.calculateTrendSlope(observations);
    }
}

module.exports = StatisticalEvaluatorKernel;
