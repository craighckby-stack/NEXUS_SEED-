/**
 * MetricOperator.js
 * Defines standardized mathematical comparison operators for governance policies
 * and includes a utility function for threshold validation.
 */

class MetricOperatorImpl {
    // Internal Operator Definitions
    static #OP_EQ = '==';
    static #OP_NEQ = '!=';
    static #OP_GT = '>';
    static #OP_LT = '<';
    static #OP_GTE = '>=';
    static #OP_LTE = '<=';

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Goal: Satisfy the synchronous setup extraction goal.
     * Initializes internal state or resolves synchronous dependencies.
     */
    #setupDependencies() {
        // No external dependencies to resolve, maintaining architectural consistency.
    }

    /**
     * I/O Proxy: Delegates to external logging system (console.warn).
     * Goal: Isolate I/O operation.
     */
    #logWarning(message) {
        console.warn(message);
    }

    /**
     * Validates a metric value against a policy threshold using a specified operator.
     *
     * @param {number} metricValue The observed value to check.
     * @param {string} operator The comparison operator (e.g., '>', '<=').
     * @param {number} threshold The policy threshold value.
     * @returns {boolean} True if the metric satisfies the comparison condition, false otherwise.
     */
    validate(metricValue, operator, threshold) {
        // I/O Proxy enforcement: Isolate input validation logging
        if (typeof metricValue !== 'number' || typeof threshold !== 'number') {
            this.#logWarning(`Metric validation error: Non-numeric input provided (Value: ${metricValue}, Threshold: ${threshold}).`);
            return false;
        }

        const normalizedOp = String(operator).toUpperCase();

        switch (normalizedOp) {
            case MetricOperatorImpl.#OP_EQ:
            case '=':
            case '==':
                return metricValue === threshold;

            case MetricOperatorImpl.#OP_NEQ:
            case '!=':
                return metricValue !== threshold;

            case MetricOperatorImpl.#OP_GT:
            case '>':
                return metricValue > threshold;

            case MetricOperatorImpl.#OP_LT:
            case '<':
                return metricValue < threshold;

            case MetricOperatorImpl.#OP_GTE:
            case '>=':
                return metricValue >= threshold;

            case MetricOperatorImpl.#OP_LTE:
            case '<=':
                return metricValue <= threshold;

            default:
                // I/O Proxy enforcement: Isolate unknown operator logging
                this.#logWarning(`Unknown metric operator used: ${operator}. Defaulting validation to false.`);
                return false;
        }
    }
}

// --- API Export Wrapper ---

const metricOperatorSingleton = new MetricOperatorImpl();

/**
 * Defines standardized mathematical comparison operators for governance policies
 * and includes a utility function for threshold validation.
 */
const MetricOperator = {
  // -- Standard Operator Definitions (Preserving original API) --
  EQ: '==',
  NEQ: '!=',
  GT: '>',
  LT: '<',
  GTE: '>=',
  LTE: '<=',

  /**
   * Validates a metric value against a policy threshold using a specified operator.
   */
  validate: (metricValue, operator, threshold) => {
    return metricOperatorSingleton.validate(metricValue, operator, threshold);
  }
};

module.exports = MetricOperator;