/**
 * VetoTriggerEvaluationKernel (VTEK)
 * Handles the programmatic evaluation of structured VETO_TRIGGER_MAP configurations (Schema 1.1).
 * Fetches metrics, applies operator comparisons, and determines the overall veto status.
 *
 * Refactored for concurrency using Promise.all and separation of config concerns.
 */
import { MetricClient } from '../data/MetricClient';
import { ThresholdEvaluatorPlugin } from '../../plugins/ThresholdEvaluatorPlugin';

class VetoTriggerEvaluationKernel {
    #metricClient;
    #configLoader;
    #configCache = null;

    /**
     * @param {MetricClient} metricClient - Injected dependency.
     * @param {VetoConfigLoaderKernel} configLoader - Injected dependency for dynamic configuration.
     */
    constructor(metricClient, configLoader) {
        this.#setupDependencies(metricClient, configLoader);
    }

    // --- SETUP AND ERROR PROXIES ---

    #throwSetupError(message) {
        throw new Error(`VetoTriggerEvaluationKernel Setup Error: ${message}`);
    }

    /**
     * Extracts synchronous dependency validation and assignment.
     */
    #setupDependencies(metricClient, configLoader) {
        if (!metricClient) {
            this.#throwSetupError("MetricClient dependency required.");
        }
        if (!configLoader) {
            this.#throwSetupError("ConfigLoader dependency required.");
        }
        
        this.#metricClient = metricClient;
        this.#configLoader = configLoader;
    }

    #throwConfigLoadError() {
        throw new Error("Veto configuration could not be loaded.");
    }

    #logMetricFetchFailure(e) {
        // Isolates I/O operation (console.error) for failed metric fetches.
        console.error("VetoTriggerEvaluationKernel Metric Fetch Failure:", e);
    }

    // --- DELEGATION PROXIES ---

    /**
     * Retrieves the veto configuration, ensuring it is loaded once and cached.
     */
    async #delegateToConfigLoader() {
        if (!this.#configCache) {
            try {
                // Delegate to external configuration service
                this.#configCache = await this.#configLoader.loadVetoTriggers();
            } catch (e) {
                this.#throwConfigLoadError(); 
            }
        }
        if (!this.#configCache) {
            this.#throwConfigLoadError(); 
        }
        return this.#configCache;
    }

    /**
     * Delegates the external metric fetch operation.
     */
    #delegateToMetricClientFetch(check) {
        return this.#metricClient.getAggregatedMetric(
            check.asset,
            check.metric,
            check.aggregation_mode,
            check.time_window
        );
    }

    /**
     * Wraps metric fetching with safe execution and failure logging, replacing the safePromise utility.
     */
    #safeExecuteMetricFetch(check) {
        return this.#delegateToMetricClientFetch(check).catch(e => {
            this.#logMetricFetchFailure(e);
            return null; // Return null on failure as fallback
        }).then(currentValue => ({ currentValue, check }));
    }

    /**
     * Delegates the external threshold evaluation utility check.
     */
    #delegateToThresholdEvaluatorCheck(currentValue, threshold) {
        return ThresholdEvaluatorPlugin.checkBreach(currentValue, threshold);
    }

    // --- CORE LOGIC ---

    /**
     * Evaluates all metric checks for a specific vector definition concurrently.
     * @param {string} vectorKey
     * @param {object} definition
     * @returns {Promise<Array<object>>} List of triggered veto objects.
     */
    async evaluateVector(vectorKey, definition) {

        // Map metric checks to parallel promises using the safe execution proxy
        const metricFetchPromises = definition.metric_checks.map(check =>
            this.#safeExecuteMetricFetch(check)
        );

        // Wait for all metric fetches to resolve concurrently
        const results = await Promise.all(metricFetchPromises);

        let triggers = [];

        // Evaluate fetched metrics
        for (const { currentValue, check } of results) {
            if (currentValue === null || currentValue === undefined) {
                 continue; // Skip failed metric fetches
            }

            if (this.#delegateToThresholdEvaluatorCheck(currentValue, check.threshold)) {
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
     * Determines the final veto status based on priority logic.
     */
    #processResultsAndDetermineVeto(config, allTriggers) {
        const criticalTriggers = allTriggers.filter(t => t.priority === 'CRITICAL');
        const highTriggers = allTriggers.filter(t => t.priority === 'HIGH');

        let vetoStatus = false;

        // Default Veto Logic based on configuration
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

    /**
     * Executes all configured vector evaluations in parallel and aggregates results.
     */
    async runVetoCheck() {
        const config = await this.#delegateToConfigLoader();
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

        return this.#processResultsAndDetermineVeto(config, allTriggers);
    }
}

export default VetoTriggerEvaluationKernel;