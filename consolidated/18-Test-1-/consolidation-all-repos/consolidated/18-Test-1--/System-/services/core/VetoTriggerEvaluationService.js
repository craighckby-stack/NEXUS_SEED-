/**
 * VetoTriggerEvaluationService (VTES)
 * Handles the programmatic evaluation of structured VETO_TRIGGER_MAP configurations (Schema 1.1).
 * Fetches metrics, applies operator comparisons, and determines the overall veto status.
 */
import { MetricClient } from '../data/MetricClient'; // Assumed dependency
import VETO_CONFIG from '../../assets/GAX/AHMID_VETO_TRIGGERS.json';

class VetoTriggerEvaluationService {
    constructor() {
        // In a real system, configuration would be loaded dynamically/cached based on asset_id
        this.config = VETO_CONFIG;
        this.metricClient = new MetricClient(); 
    }

    /**
     * Executes the comparison logic based on the structured threshold operator.
     * @param {number|boolean} currentValue
     * @param {object} threshold {operator, value}
     * @returns {boolean} True if the threshold is breached (trigger condition met).
     */
    _checkBreach(currentValue, threshold) {
        const { operator, value } = threshold;
        switch (operator) {
            case 'LT': return currentValue < value;
            case 'GT': return currentValue > value;
            case 'EQ': return currentValue === value;
            case 'LE': return currentValue <= value;
            case 'GE': return currentValue >= value;
            default:
                console.error(`VTES Error: Unknown operator ${operator}`);
                return false;
        }
    }

    async evaluateVector(vectorKey, definition) {
        let triggers = [];

        for (const check of definition.metric_checks) {
            // Fetch metric using defined aggregation mode and time window
            const currentValue = await this.metricClient.getAggregatedMetric(
                check.asset,
                check.metric,
                check.aggregation_mode,
                check.time_window
            );

            if (this._checkBreach(currentValue, check.threshold)) {
                triggers.push({
                    vector: vectorKey,
                    priority: definition.priority,
                    metric: check.metric,
                    value: currentValue,
                    threshold_breached: check.threshold
                });
            }
        }
        return triggers;
    }

    async runVetoCheck() {
        let allTriggers = [];
        const vectorDefs = this.config.vector_definitions;

        for (const [key, definition] of Object.entries(vectorDefs)) {
            const results = await this.evaluateVector(key, definition);
            allTriggers = allTriggers.concat(results);
        }

        // The system determines a VETO if any CRITICAL trigger is fired, or based on weighted HIGH triggers.
        const criticalTriggered = allTriggers.some(t => t.priority === 'CRITICAL');

        if (allTriggers.length > 0) {
            return { veto_status: criticalTriggered, triggers: allTriggers };
        }

        return { veto_status: false };
    }
}

export default VetoTriggerEvaluationService;