/**
 * MetricPostProcessor (v94.2)
 * Responsible for post-collection metric processing, including validation,
 * data transformation, threshold checks, and standardization of output structure.
 */
class MetricPostProcessor {
    /**
     * @param {object} dependencies - Dependencies object
     * @param {object} dependencies.logger - Standardized system logger.
     */
    constructor({ logger }) {
        this.logger = logger;
    }

    /**
     * Processes the raw metric result, applies transformations, checks thresholds, and standardizes the output.
     * @param {object} template - The metric definition template.
     * @param {*} rawResult - The value returned by the execution handler.
     * @returns {object} The standardized metric object.
     */
    process(template, rawResult) {
        const metricId = template.id; 
        let value = rawResult;
        let status = 'OK';
        let alerts = [];

        // 1. Value Validation (Example: Check for null/NaN)
        if (typeof value !== 'number' || isNaN(value)) {
            this.logger.warn(`[PostProcessor] Metric ${metricId} returned invalid value type.`);
            return this.createFailureResponse(metricId, 'InvalidValueType', 'Raw result was not a valid number or expected type.');
        }

        // 2. Transformation/Scaling (Example: Convert milliseconds to seconds)
        // if (template.scale === 'to_seconds') { value /= 1000; }

        // 3. Threshold Checks
        if (template.thresholds) {
            const { critical, warning } = template.thresholds;
            if (critical && value >= critical) {
                status = 'CRITICAL';
                alerts.push('CRITICAL threshold breached');
            } else if (warning && value >= warning) {
                status = 'WARNING';
                alerts.push('WARNING threshold breached');
            }
        }

        // 4. Return standardized structure
        return {
            metricId,
            timestamp: Date.now(),
            value: value,
            status: status,
            alerts: alerts,
            method: template.calculation_method
        };
    }

    /**
     * Creates a standardized failure response object.
     * @param {string} metricId
     * @param {string} type - A categorical error code (e.g., 'HandlerNotConfigured').
     * @param {string} [message] - Detailed error message.
     * @returns {object}
     */
    createFailureResponse(metricId, type, message = 'Metric collection failed due to an internal issue.') {
        this.logger.error(`Metric Failure (${type}): ${metricId} - ${message}`);
        return {
            metricId,
            timestamp: Date.now(),
            status: 'FAILURE',
            value: null,
            error: { type, message }
        };
    }
}

module.exports = MetricPostProcessor;