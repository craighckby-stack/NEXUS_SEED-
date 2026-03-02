/**
 * Utility Component ID: SEV
 * Name: Statistical Evaluator
 * Function: Provides centralized, high-efficiency mathematical functions for analyzing time-series data,
 *           specifically targeting volatility and trend analysis required by the Adaptive Tuner (ATN).
 */

/**
 * Calculates the standard deviation of a dataset (proxy for metric volatility).
 * @param {Array<number>} data - Array of recent metric observations.
 * @returns {number} The standard deviation.
 */
function calculateVolatility(data) {
    if (!data || data.length < 2) return 0;

    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    
    // Sum of squared differences from the mean
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (n - 1);

    return Math.sqrt(variance);
}

/**
 * Determines the short-term trend direction based on a linear regression slope.
 * @param {Array<Object>} observations - Array of { value: number, timestamp: number } objects.
 * @returns {number} The slope of the trend (positive for increasing, negative for decreasing).
 */
function calculateTrendSlope(observations) {
    if (!observations || observations.length < 2) return 0;

    // Simple linear regression (y = mx + b), where x is time index (0, 1, 2...) and y is the value.
    const n = observations.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        const x = i; // Use index as time proxy
        const y = observations[i].value;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }

    const denominator = (n * sumX2) - (sumX * sumX);
    if (denominator === 0) return 0;
    
    // Slope (m)
    const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
    return slope;
}

module.exports = {
    calculateVolatility,
    calculateTrendSlope
};