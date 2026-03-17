/**
 * VetoTriggerEvaluationService (VTES)
 * Handles the programmatic evaluation of structured VETO_TRIGGER_MAP configurations (Schema 1.1).
 * Fetches metrics, applies operator comparisons, and determines the overall veto status.
 * 
 * Refactored for concurrency using Promise.all and separation of config concerns.
 */
import { MetricClient } from '../data/MetricClient';
// MetricClient is assumed to exist. VetoConfigLoaderService is proposed/injected.

/**
 * A utility wrapper to ensure parallel operations don't fail Promise.all on single exceptions.
 * @param {Promise} promise
 * @param {*} fallback Value to return if the promise rejects.
 * @returns {Promise<*>} Resolved promise containing the result or fallback value.
 */
const safePromise = (promise, fallback = null) => {
    return promise.catch(e => {
        console.error("VTES Metric Fetch Failure:", e);
        return fallback;
    });
};

class VetoTriggerEvaluationService {
    /**
     * @param {MetricClient} metricClient - Injected dependency.
     * @param {VetoConfigLoaderService} configLoader - Injected dependency for dynamic configuration.
     */
    constructor(metricClient, configLoader) {
        if (!configLoader) {
            console.error("VTES Initialization Error: configLoader dependency required.");
        }
        this.metricClient = metricClient || new MetricClient(); 
        this.configLoader = configLoader; 
        this._configCache = null;
    }

    /**
     * Retrieves the veto configuration, ensuring it is loaded once and cached.
     * @returns {Promise<object>} The cached or newly loaded configuration object.
     */
    async _getConfig() {
        if (!this._configCache) {
            // Assumes configLoader provides loadVetoTriggers()
            this._configCache = await this.configLoader.loadVetoTriggers();
        }
        if (!this._configCache) {
             throw new Error("Veto configuration could not be loaded.");
        }
        return this._configCache;
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

    /**
     * Evaluates all metric checks for a specific vector definition concurrently.
     * @param {string} vectorKey
     * @param {object} definition
     * @returns {Promise<Array<object>>} List of triggered veto objects.
     */
    async evaluateVector(vectorKey, definition) {
        
        // Map metric checks to parallel promises
        const metricFetchPromises = definition.metric_checks.map(check => 
            safePromise(
                this.metricClient.getAggregatedMetric(
                    check.asset,
                    check.metric,
                    check.aggregation_mode,
                    check.time_window
                ), 
                // On failure, return null but keep the promise chain resolving for Promise.all
            ).then(currentValue => ({ currentValue, check }))
        );

        // Wait for all metric fetches to resolve concurrently
        const results = await Promise.all(metricFetchPromises);

        let triggers = [];

        // Evaluate fetched metrics
        for (const { currentValue, check } of results) {
            if (currentValue === null || currentValue === undefined) {
                 continue; // Skip failed metric fetches (handled by safePromise)
            }

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

    /**
     * Executes all configured vector evaluations in parallel and aggregates results.
     * Determines the final veto status based on priority logic.
     */
    async runVetoCheck() {
        const config = await this._getConfig(); 
        const vectorDefs = config.vector_definitions;
        const vectorKeys = Object.keys(vectorDefs);

        // Map definitions to parallel vector evaluation promises
        const vectorPromises = vectorKeys.map(key => 
            this.evaluateVector(key, vectorDefs[key])
        );

        // Wait for all vector evaluations to complete concurrently
        const allVectorResults = await Promise.all(vectorPromises);

        // Flatten the array of trigger arrays into a single list
        const allTriggers = allVectorResults.flat();
        
        const criticalTriggers = allTriggers.filter(t => t.priority === 'CRITICAL');
        const highTriggers = allTriggers.filter(t => t.priority === 'HIGH');
        
        let vetoStatus = false;

        // Default Veto Logic based on configuration (enhanced intelligence/flexibility)
        if (criticalTriggers.length > 0) {
            vetoStatus = true;
        } else if (config.high_trigger_threshold && highTriggers.length >= config.high_trigger_threshold) { 
             // Allows configuration to define how many 'HIGH' triggers constitute a veto.
             vetoStatus = true;
        }

        if (allTriggers.length > 0) {
            return { 
                veto_status: vetoStatus, 
                triggers: allTriggers,
                summary: {
                    critical_count: criticalTriggers.length,
                    high_count: highTriggers.length,
                    total_triggers: allTriggers.length
                }
            };
        }

        return { veto_status: false };
    }
}

export default VetoTriggerEvaluationService;