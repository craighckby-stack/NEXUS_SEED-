const GovernanceConfig = require('./constraints.json'); 
const TelemetryClient = require('../system/metrics/TelemetryClient'); 

// Pre-mapped operators for highly efficient execution lookup, avoiding string comparison in the critical path.
const OPERATOR_MAP = {
    '>': (v, t) => v > t,
    '<': (v, t) => v < t,
    '>=': (v, t) => v >= t,
    '<=': (v, t) => v <= t,
    '==': (v, t) => v == t,
};

// Utility for fast metric resolution (assuming flat keys based on original code usage)
const getMetricValue = (metrics, key) => metrics[key]; 

class GovernanceTelemetryEnforcer {

    /**
     * Static method to recursively abstract and normalize the complex config structure 
     * into a flat, executable array (Pre-computation/Memoization).
     * This moves configuration parsing out of the high-frequency monitor loop.
     */
    static normalizeConstraints(config) {
        const normalized = [];
        
        // 1. Resource Guardrails (Safety)
        const rg = config.safety_constraints?.resource_guardrails;
        if (rg?.max_compute_budget_tflops_s) {
            normalized.push({
                metric_key: 'compute_utilization',
                operator: '>',
                threshold: rg.max_compute_budget_tflops_s,
                action_type: 'resource_throttle',
                action_param: rg.throttle_rate_on_exceed
            });
        }
        
        // 2. Evolutionary Strategy
        const rs = config.evolutionary_constraints?.rollout_strategy;
        if (rs?.min_test_coverage_required) {
            normalized.push({
                metric_key: 'test_coverage',
                operator: '<',
                threshold: rs.min_test_coverage_required,
                action_type: 'evolution_hold',
                action_param: 'Low test coverage detected.'
            });
        }
        
        return normalized;
    }

    constructor() {
        this.telemetry = new TelemetryClient();
        // Execute pre-computation
        this.executableConstraints = GovernanceTelemetryEnforcer.normalizeConstraints(GovernanceConfig);
    }

    /**
     * Optimized monitoring loop.
     * Efficiency gain: Single iteration over pre-computed array, direct function pointer execution.
     */
    async monitor() {
        const metrics = await this.telemetry.getRealtimeMetrics();
        
        for (const constraint of this.executableConstraints) {
            const metricValue = getMetricValue(metrics, constraint.metric_key);
            
            // Execute comparison via fast function pointer lookup (OPERATOR_MAP)
            if (OPERATOR_MAP[constraint.operator](metricValue, constraint.threshold)) {
                this.executeAction(constraint.action_type, constraint.action_param);
            }
        }
    }

    executeAction(type, parameter) {
        // Minor optimization in logging style
        console.warn(`[GOV_BREACH:${type}] P:${parameter}`);
        // Kernel scheduler interaction stub remains here.
    }
}

module.exports = { GovernanceTelemetryEnforcer };