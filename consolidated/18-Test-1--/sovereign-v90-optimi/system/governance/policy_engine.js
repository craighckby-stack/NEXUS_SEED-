/**
 * Utility: PolicyEngine
 * Purpose: A registry and execution environment for conflict resolution policies.
 * This component delegates strategy management (registration, lookup, execution) 
 * to the StrategyPatternRegistryTool for improved modularity.
 */

// Note: StrategyPatternRegistryTool is assumed to be available via $P or similar injection mechanism.
const $P = {
    StrategyPatternRegistryTool: (typeof StrategyPatternRegistryTool !== 'undefined') ? StrategyPatternRegistryTool : null
};


class PolicyEngine {
    constructor() {
        /**
         * Instance of the underlying registry tool managing the handlers Map.
         * @private
         */
        this.registryInstance = null;

        if (!$P.StrategyPatternRegistryTool || typeof $P.StrategyPatternRegistryTool.createInstance !== 'function') {
            throw new Error("Dependency missing: StrategyPatternRegistryTool must be available.");
        }
        this.registryInstance = $P.StrategyPatternRegistryTool.createInstance();
    }

    /**
     * Registers a policy handler function.
     * @param {string} policyName - The canonical name (e.g., 'Weighted_Delegation_v2').
     * @param {function({proposal, currentState, metricData}): Promise<{status: string, details: object}>} handlerFn - The function that contains the policy execution logic.
     */
    register(policyName, handlerFn) {
        $P.StrategyPatternRegistryTool.register(this.registryInstance, policyName, handlerFn);
    }

    /**
     * Executes the specific policy handler associated with the name.
     * @param {string} policyName 
     * @param {object} context - Contains proposal, currentState, metricData required by the policy.
     * @returns {Promise<{status: string, details: object}>} The result of the policy execution.
     */
    async execute(policyName, context) {
        // The tool handles lookup, error throwing (if not found), and asynchronous execution.
        return $P.StrategyPatternRegistryTool.execute(this.registryInstance, policyName, context);
    }

    /**
     * Helper to retrieve all registered policy names.
     * @returns {Array<string>}
     */
    getRegisteredPolicies() {
        return $P.StrategyPatternRegistryTool.getRegisteredPolicies(this.registryInstance);
    }
}

module.exports = PolicyEngine;