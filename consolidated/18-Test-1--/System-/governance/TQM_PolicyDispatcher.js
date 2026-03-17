import fs from 'fs';

/**
 * TQM_PolicyDispatcher handles the evaluation of metrics against defined quality gates
 * and dispatches resulting violations to appropriate enforcement handlers.
 */
class TQM_PolicyDispatcher {
    /**
     * @param {string} policyConfigPath - Path to the JSON configuration file defining policies and gates.
     */
    constructor(policyConfigPath) {
        // Note: Synchronous loading is used for initialization, typical for configuration modules.
        this.config = this._loadConfig(policyConfigPath);
        this.gates = this.config.quality_gates || {};
    }

    /**
     * Loads the policy configuration synchronously.
     * @param {string} filePath
     * @returns {object}
     * @private
     */
    _loadConfig(filePath) {
        try {
            const rawData = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(rawData);
        } catch (error) {
            console.error(`[TQM Dispatcher] Failed to load configuration from ${filePath}:`, error.message);
            return { quality_gates: {} };
        }
    }

    /**
     * Evaluates a single metric value against all relevant policies.
     * @param {string} metricKey - The identifier of the metric being checked.
     * @param {number} value - The numerical value of the metric.
     * @param {object} context - Additional context data.
     * @returns {Array<object>} List of violations found.
     */
    evaluateMetric(metricKey, value, context = {}) {
        const violations = [];
        
        // Iterate through all gates and policies
        for (const gateName in this.gates) {
            const gateData = this.gates[gateName];
            const policies = gateData.policies || [];

            for (const policy of policies) {
                if (policy.metric_key === metricKey) {
                    const violationDetails = this._checkViolation(policy, value);
                    if (violationDetails) {
                        violations.push({
                            policy_id: policy.id,
                            severity: policy.severity,
                            handler: policy.enforcement_handler,
                            auto_fixable: policy.auto_fixable,
                            details: violationDetails
                        });
                    }
                }
            }
        }
        
        return violations;
    }

    /**
     * Checks if a specific value violates a policy threshold.
     * @param {object} policy
     * @param {number} value
     * @returns {string | null} Violation message or null if no violation.
     * @private
     */
    _checkViolation(policy, value) {
        const threshold = policy.threshold;
        const mode = policy.mode;
        
        if (mode === 'MAX_VIOLATION' && value > threshold) {
            return `Value ${value} exceeds max threshold ${threshold}.`;
        }
        if (mode === 'MIN_REQUIREMENT' && value < threshold) {
            return `Value ${value} is below minimum requirement ${threshold}.`;
        }
        
        return null;
    }

    /**
     * Dispatches violations to their specified handlers.
     * @param {Array<object>} violations
     */
    dispatchViolations(violations) {
        for (const violation of violations) {
            const handler = violation.handler;
            console.log(`[Dispatcher] Dispatching ${violation.severity} violation to handler: ${handler}`);
            // Execution: UNIFIER.invokeModule(handler, violation);
        }
    }
}

export { TQM_PolicyDispatcher };