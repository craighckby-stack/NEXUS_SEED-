/**
 * Utility: PolicyEngine
 * Purpose: A registry and execution environment for conflict resolution policies.
 * This enables CLARA (ClaraResolver) to delegate complex, strategy-specific
 * resolution logic externally, implementing the Strategy Pattern.
 */

class PolicyEngine {
    constructor() {
        /** 
         * Policy handlers are registered here. Stores functions that execute the policy logic.
         * Structure: { [policyName]: handlerFunction }
         */
        this.handlers = new Map();
    }

    /**
     * Registers a policy handler function.
     * @param {string} policyName - The canonical name (e.g., 'Weighted_Delegation_v2').
     * @param {function({proposal, currentState, metricData}): Promise<{status: string, details: object}>} handlerFn - The function that contains the policy execution logic.
     */
    register(policyName, handlerFn) {
        if (typeof handlerFn !== 'function') {
            throw new Error(`Policy registration failed for ${policyName}: Handler must be a function.`);
        }
        this.handlers.set(policyName, handlerFn);
        // console.log(`PolicyEngine registered handler: ${policyName}`); // Optional logging
    }

    /**
     * Executes the specific policy handler associated with the name.
     * @param {string} policyName 
     * @param {object} context - Contains proposal, currentState, metricData required by the policy.
     * @returns {Promise<{status: string, details: object}>} The result of the policy execution.
     * @throws {Error} If the policy is not registered.
     */
    async execute(policyName, context) {
        const handler = this.handlers.get(policyName);
        if (!handler) {
            throw new Error(`Policy not registered: ${policyName}`);
        }
        // Execute the policy handler, passing the resolution context
        return handler(context);
    }

    /**
     * Helper to retrieve all registered policy names.
     * @returns {Array<string>}
     */
    getRegisteredPolicies() {
        return Array.from(this.handlers.keys());
    }
}

module.exports = PolicyEngine;