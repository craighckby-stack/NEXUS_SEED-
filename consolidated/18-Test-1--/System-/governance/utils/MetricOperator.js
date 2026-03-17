/**
 * governance/utils/MetricOperator.js
 * Defines standardized operators for threshold comparison within policy evaluation.
 */
const MetricOperator = {
    // Greater Than: Breach if actual_value > threshold
    GT: 'GT',
    // Less Than: Breach if actual_value < threshold
    LT: 'LT',
    // Equal To: Breach if actual_value === threshold
    EQ: 'EQ',
    // Greater Than or Equal To
    GTE: 'GTE',
    // Less Than or Equal To
    LTE: 'LTE',
    // Not Equal To
    NE: 'NE'
};

/**
 * Validates a numeric value against a numeric threshold using a specified comparison operator.
 * @param {number} value - The observed metric value.
 * @param {string} operator - One of MetricOperator keys (e.g., 'GT', 'LT').
 * @param {number} threshold - The configured policy threshold.
 * @returns {boolean}
 */
MetricOperator.validate = (value, operator, threshold) => {
    if (typeof value !== 'number' || typeof threshold !== 'number') {
        // Note: Engine should log this failure, but validator returns false safely.
        return false;
    }

    switch (operator.toUpperCase()) {
        case MetricOperator.GT: return value > threshold;
        case MetricOperator.LT: return value < threshold;
        case MetricOperator.EQ: return value === threshold;
        case MetricOperator.GTE: return value >= threshold;
        case MetricOperator.LTE: return value <= threshold;
        case MetricOperator.NE: return value !== threshold;
        default:
            // If operator is unknown, treat it as failure or use a safe default (e.g., GT)
            console.warn(`[MetricOperator] Unknown or unsupported operator: ${operator}. Defaulting to false.`);
            return false;
    }
};

module.exports = MetricOperator;