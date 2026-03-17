/**
 * AGI-KERNEL v7.11.3 - ProposalMetricsEngineKernel
 * Optimized for efficiency using an Abstracted, Plugin-based Calculation Architecture.
 * Features O(1) state lookups and lazy/memoized metric calculation.
 */

// --- CONTRACT DEFINITION ---
/**
 * Abstract base class serving as the formal contract (IProposalMetricPlugin) 
 * for all metric calculation units. Defines the necessary structure for injection.
 */
class AbstractMetricPlugin {
    /**
     * @param {string} metricName - The name under which the metric will be reported.
     */
    constructor(metricName) {
        if (new.target === AbstractMetricPlugin) {
            throw new TypeError("Cannot instantiate AbstractMetricPlugin directly. Must extend.");
        }
        if (typeof metricName !== 'string' || metricName.trim() === '') {
             throw new Error("Metric name must be a non-empty string.");
        }
        this.name = metricName;
    }

    /**
     * Processes a new event to update the internal state of the metric.
     * Must be computationally cheap (ideally O(1)) to maintain ingestion throughput.
     * @param {object} proposalState - The engine's internal state for this proposal.
     * @param {object} event - The specific event delta (e.g., vote, new block).
     */
    processEvent(proposalState, event) {
        throw new Error(`Plugin ${this.name}: Method 'processEvent' must be implemented.`);
    }

    /**
     * Calculates or retrieves the final metric value based on the current state.
     * Implementation should prioritize memoization if calculation is complex (O(n)).
     * @param {object} proposalState - The current state object.
     * @returns {*} The calculated metric value.
     */
    calculate(proposalState) {
        throw new Error(`Plugin ${this.name}: Method 'calculate' must be implemented.`);
    }
}
// --- END CONTRACT DEFINITION ---


class ProposalMetricsEngineKernel {
    /**
     * Enforces Dependency Injection for metric configuration.
     * 
     * @param {AbstractMetricPlugin[]} metricPlugins - The list of metric plugins to initialize the engine with.
     */
    constructor(metricPlugins) {
        /** @type {Map<string, AbstractMetricPlugin>} Registered calculation plugins. */
        this.plugins = new Map();
        /** 
         * @type {Map<string, object>} Proposal state storage for O(1) lookup.
         * state structure: { id: string, metrics: Map<string, *>, startTime: number, internalData: object }
         */
        this.proposalStates = new Map();

        this.#setupDependencies(metricPlugins);
    }

    /**
     * Initializes the plugin map based on injected dependencies, enforcing structural integrity 
     * and immutability of the configuration set.
     * @param {AbstractMetricPlugin[]} metricPlugins 
     */
    #setupDependencies(metricPlugins) {
        if (!Array.isArray(metricPlugins)) {
            throw new TypeError("Metric plugins must be provided as an array.");
        }

        for (const plugin of metricPlugins) {
            // Enforce dependency injection requirements by checking contract adherence
            if (!(plugin instanceof AbstractMetricPlugin)) {
                throw new TypeError("Engine only accepts instances derived from AbstractMetricPlugin.");
            }
            if (this.plugins.has(plugin.name)) {
                throw new Error(`Dependency Injection Error: Duplicate plugin name registered: '${plugin.name}'.`);
            }
            this.plugins.set(plugin.name, plugin);
        }
    }


    /**
     * Ingests a new event, applying the delta to all active metric plugins.
     * @param {string} proposalId - The target proposal identifier.
     * @param {object} event - The event data (e.g., { type: 'VOTE', voter: 'addr1', weight: 10 }).
     */
    ingestEvent(proposalId, event) {
        let state = this.proposalStates.get(proposalId);
        
        if (!state) {
            state = {
                id: proposalId,
                metrics: new Map(), // O(1) cache for calculated results
                startTime: Date.now(), 
                internalData: {},
            };
            this.proposalStates.set(proposalId, state);
        }

        // 1. Process event through all active plugins (O(N_plugins))
        for (const plugin of this.plugins.values()) {
            plugin.processEvent(state, event);
        }

        // 2. Invalidate aggregate metric cache after processing new data.
        state.metrics.clear(); 
    }

    /**
     * Retrieves the current metrics for a proposal, using memoization.
     * Calculation is lazy and only runs if the cache is invalidated.
     * @param {string} proposalId
     * @returns {object|null}
     */
    getMetrics(proposalId) {
        const state = this.proposalStates.get(proposalId);
        if (!state) return null;

        // Memoization check: If cache is full and valid, return quickly (O(1))
        if (state.metrics.size === this.plugins.size && state.metrics.size > 0) {
             return Object.fromEntries(state.metrics);
        }

        const calculatedMetrics = {};

        // Calculate missing metrics (Lazy Calculation)
        for (const [name, plugin] of this.plugins) {
            let value;
            if (state.metrics.has(name)) {
                value = state.metrics.get(name);
            }
             else {
                // Delegate heavy lifting to the plugin's calculate method
                value = plugin.calculate(state);
                // Update global state cache
                state.metrics.set(name, value);
            }
            calculatedMetrics[name] = value;
        }

        return calculatedMetrics;
    }

    /**
     * Cleans up internal state for finalized or expired proposals.
     * @param {string} proposalId
     */
    pruneProposal(proposalId) {
        // O(1) removal
        this.proposalStates.delete(proposalId);
    }
}

module.exports = {
    ProposalMetricsEngineKernel,
    AbstractMetricPlugin
};
