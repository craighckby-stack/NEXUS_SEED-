/**
 * src/engine/DialAnalysisRuleEngine.js
 * Rule engine designed to parse and execute the structured logic defined in config/dial_analysis_map.json.
 * It translates raw telemetry metrics into preconditions and executes complex logical rules.
 */

class DialAnalysisRuleEngine {

    /**
     * Static map of supported comparison operators.
     * Ensures derivePreconditions remains clean and extensible.
     */
    static COMPARATORS = {
        'GT': (value, threshold) => value > threshold,
        'LT': (value, threshold) => value < threshold,
        'EQ': (value, threshold) => value === threshold,
        'GTE': (value, threshold) => value >= threshold,
        'LTE': (value, threshold) => value <= threshold,
        'DEFAULT': (value, threshold) => value === threshold, // Fallback
    };

    constructor(config) {
        if (!config || !config.metrics_config || !config.precondition_definitions || !config.response_rules) {
            throw new Error("DialAnalysisRuleEngine requires a complete configuration structure.");
        }

        // Ensure rules are sorted only once, high priority first.
        this.rules = config.response_rules.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0)); 
        this.preconditions = config.precondition_definitions;
        this.metricsConfig = config.metrics_config;
    }

    /**
     * Evaluates raw telemetry against defined metrics_config to derive boolean preconditions.
     * @param {Object<string, number>} telemetry - Runtime sensor readings.
     * @returns {Object<string, boolean>} Derived boolean preconditions.
     */
    derivePreconditions(telemetry) {
        const derived = {};
        
        for (const [key, definition] of Object.entries(this.preconditions)) {
            const metricKey = definition.check;
            const metricConf = this.metricsConfig[metricKey];
            const value = telemetry[metricKey];

            // Check if configuration exists and telemetry data is present and valid (not null/undefined)
            if (metricConf && typeof value === 'number') {
                const { threshold, operator } = metricConf;
                
                // Use the static comparator map, falling back to default if operator is unknown
                const comparator = DialAnalysisRuleEngine.COMPARATORS[operator] || DialAnalysisRuleEngine.COMPARATORS.DEFAULT;

                derived[key] = comparator(value, threshold);
            } else if (metricConf) {
                // If configuration exists but telemetry is missing, precondition is defaulted to false/safe
                derived[key] = false;
            }
        }
        return derived;
    }

    /**
     * Internal helper to execute a single logical clause (AND/OR/NOT_ANY).
     * @param {Object} logic - { operator: string, references: string[] }
     * @param {Object<string, boolean>} derivedPreconditions
     * @returns {boolean}
     */
    _evaluateLogic(logic, derivedPreconditions) {
        const { operator, references } = logic;

        switch (operator) {
            case "AND":
                // Must check against `true` explicitly to handle potential undefined references gracefully
                return references.every(ref => derivedPreconditions[ref] === true);
            case "OR":
                return references.some(ref => derivedPreconditions[ref] === true);
            case "NOT_ANY": 
                // True if NONE of the referenced preconditions are true.
                return !references.some(ref => derivedPreconditions[ref] === true);
            case "NOT_ALL": 
                // True if at least one referenced precondition is NOT true.
                return references.some(ref => derivedPreconditions[ref] === false || derivedPreconditions[ref] === undefined);
            case "DEFAULT":
                return true;
            default:
                console.warn(`[DialAnalysisRuleEngine] Unknown logic operator in rule: ${operator}`);
                return false;
        }
    }

    /**
     * Executes response rules against derived preconditions, respecting rule priority.
     * @param {Object<string, boolean>} derivedPreconditions
     * @returns {string | null} The determined output action or null.
     */
    executeRules(derivedPreconditions) {
        for (const rule of this.rules) {
            if (this._evaluateLogic(rule.logic, derivedPreconditions)) {
                return rule.output; 
            }
        }
        return null; // No rule matched
    }
}

export default DialAnalysisRuleEngine;