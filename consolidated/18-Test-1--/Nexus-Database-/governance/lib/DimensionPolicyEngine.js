// governance/lib/DimensionPolicyEngine.js

const MetricOperator = require('../utils/MetricOperator'); 

/**
 * Purpose: Evaluates real-time metrics against defined dimensional thresholds and executes prescribed governance actions.
 *
 * Assumed Policy definition structure (must include operator field):
 * {
 *   dim_key: string,
 *   breach_threshold: number,
 *   operator: string (e.g., 'GT', 'LT'), 
 *   governance_action: string,
 *   fail_fast_enabled: boolean
 * }
 */
class DimensionPolicyEngine {
    /**
     * @param {object} dependencies 
     * @param {object} dependencies.configSource - Source to load dimensional policies.
     * @param {object} dependencies.actionExecutor - Component responsible for executing remediation actions.
     * @param {object} dependencies.logger - Structured logging utility.
     * @param {object} [dependencies.metricsClient] - Client for fetching metrics (optional if metrics are provided externally).
     */
    constructor({ configSource, actionExecutor, logger, metricsClient }) {
        if (!configSource || !actionExecutor || !logger) {
            throw new Error("DimensionPolicyEngine requires configSource, actionExecutor, and logger dependencies.");
        }

        this.config = configSource.loadConfig('dim_operational_config');
        this.actions = actionExecutor;
        this.logger = logger;
        this.metrics = metricsClient;

        if (!Array.isArray(this.config.dimension_definitions) || this.config.dimension_definitions.length === 0) {
            this.logger.warn('DimensionPolicyEngine initialized but no dimension policies were loaded.');
        }
    }

    /**
     * Checks if a specific dimension is breached based on its definition and value.
     * @param {number} metricValue - The actual metric value observed.
     * @param {object} definition - The policy definition object.
     * @returns {boolean}
     */
    checkDimensionBreach(metricValue, definition) {
        const { breach_threshold, operator = MetricOperator.GT } = definition;

        if (typeof metricValue !== 'number' || isNaN(metricValue)) {
            this.logger.error('Attempted breach check with non-numeric metric value.', { key: definition.dim_key, value: metricValue });
            return false;
        }
        
        return MetricOperator.validate(metricValue, operator, breach_threshold);
    }

    /**
     * Evaluates real-time metrics against all configured dimensional policies.
     * @param {Map<string, number>} realTimeMetrics - Metrics keyed by dim_key.
     * @returns {Promise<{ status: 'Operational' | 'CriticalFailure', key?: string }>}
     */
    async evaluateAllDimensions(realTimeMetrics) {
        if (!(realTimeMetrics instanceof Map)) {
             this.logger.error('Input metrics must be provided as a Map (Map<string, number>).');
             return { status: 'Operational' };
        }
        
        for (const definition of this.config.dimension_definitions) {
            const dimKey = definition.dim_key;
            const metricValue = realTimeMetrics.get(dimKey);
            
            if (metricValue === undefined) {
                this.logger.debug(`Skipping policy check for missing metric: ${dimKey}`);
                continue;
            }

            const isBreached = this.checkDimensionBreach(metricValue, definition);

            if (isBreached) {
                this.logger.alert(`Dimension policy breach detected. Executing governance action.`, {
                    dimension: dimKey,
                    value: metricValue,
                    threshold: definition.breach_threshold,
                    operator: definition.operator || MetricOperator.GT,
                    action: definition.governance_action
                });
                
                await this.actions.execute(definition.governance_action, definition)
                    .catch(err => {
                         this.logger.error(`Failed to execute governance action ${definition.governance_action}`, { error: err.message, dimKey });
                    });

                if (definition.fail_fast_enabled) {
                    this.logger.critical(`Fail-fast triggered for critical dimension: ${dimKey}`);
                    return { status: 'CriticalFailure', key: dimKey };
                }
            }
        }
        
        return { status: 'Operational' };
    }
}

module.exports = DimensionPolicyEngine;