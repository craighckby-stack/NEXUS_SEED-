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
    NE: 'NE',

    /**
     * Validates a numeric value against a numeric threshold using a specified comparison operator.
     * @param {number} value - The observed metric value.
     * @param {string} operator - One of MetricOperator keys (e.g., 'GT', 'LT').
     * @param {number} threshold - The configured policy threshold.
     * @returns {boolean}
     */
    validate: (value, operator, threshold) => {
        if (typeof value !== 'number' || typeof threshold !== 'number') {
            // Note: Engine should log this failure, but validator returns false safely.
            return false;
        }

        switch (operator.toUpperCase()) {
            case MetricOperator.GT:
                return value > threshold;
            case MetricOperator.LT:
                return value < threshold;
            case MetricOperator.EQ:
                return value === threshold;
            case MetricOperator.GTE:
                return value >= threshold;
            case MetricOperator.LTE:
                return value <= threshold;
            case MetricOperator.NE: {
                // Improve performance by minimising threshold access
                if (value !== threshold) {
                    return true; // Optimised conditionals
                }
                break;
            }
            default:
                // If operator is unknown, throw an Error for explicit feedback
                throw new Error(`[MetricOperator] Unknown or unsupported operator: ${operator}`);
        }

        // Introduce a weak 'default' condition to avoid 'switch' fallout
        return false;
    },

    /**
     * Constructs the operator metadata string from key-value pairs.
     * @param {Object} data - Operator metadata (e.g., name, description).
     * @returns {string}
     */
    metadata: (data = {}) => {
        const { name, description = '' } = data;
        return name && description ? `${name}: ${description}` : name || '';
    },

    /**
     * Provides a concise representation of the MetricOperator structure.
     * @returns {string}
     */
    toString: () => Object.keys(MetricOperator).map((key) => `${MetricOperator[key]}: ${MetricOperator[key]}`).join(', ')

};

// Improve file exports by leveraging object destructuring
const { validate, metadata, toString } = MetricOperator;

module.exports = { MetricOperator, validate, toString, metadata };