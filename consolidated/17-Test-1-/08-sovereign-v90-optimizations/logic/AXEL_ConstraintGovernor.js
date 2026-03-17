/**
 * AXELConstraintGovernorService.js
 * 
 * Service for implementing Adaptive QoS based on real-time performance metrics.
 * Dynamically overrides AXEL_RuntimeConfig constraints to optimize resource utilization.
 * 
 * Logic delegated to AdaptiveQoSConstraintGovernor tool, ensuring strict architectural
 * separation via private fields and dedicated I/O proxy methods.
 */

const ToolRegistry = globalThis.ToolRegistry || {}; 

export class AXELConstraintGovernorService {
    
    // Private field for storing the resolved dependency
    #governorTool = null;

    /**
     * Initializes the service and resolves the AdaptiveQoSConstraintGovernor tool dependency.
     * @param {object} [GovernorTool] - Optional tool instance injection (highest priority).
     */
    constructor(GovernorTool) {
        // Synchronous setup extraction goal satisfied
        this.#setupDependencies(GovernorTool);
    }

    // I/O Proxy: Handles external dependency lookup (Registry, Global scope)
    #resolveGovernorTool(injectedTool) {
        // Prioritize injection, then registry/global lookup.
        return injectedTool 
            || ToolRegistry.AdaptiveQoSConstraintGovernor 
            || globalThis.AdaptiveQoSConstraintGovernor;
    }
    
    // I/O Proxy: Handles external console interaction (logging)
    #logMissingDependencyWarning() {
        console.warn("AdaptiveQoSConstraintGovernor tool is missing or improperly defined. Cannot apply adaptive QoS.");
    }
    
    // Synchronous Setup Extraction: Resolves and validates mandatory dependency
    #setupDependencies(GovernorTool) {
        const Governor = this.#resolveGovernorTool(GovernorTool);

        if (!Governor || typeof Governor.execute !== 'function') {
            this.#logMissingDependencyWarning();
            // Tool remains null, relying on the public method to handle the fallback.
            return;
        }
        this.#governorTool = Governor;
    }

    // I/O Proxy: Delegates execution to the external tool
    #delegateToGovernorExecution(currentConstraints, performanceMetrics) {
        // Delegate the complex calculation to the plugin.
        return this.#governorTool.execute({
            currentConstraints,
            performanceMetrics
        });
    }

    /**
     * Calculates optimal runtime constraints based on performance feedback.
     *
     * @param {object} currentConstraints - The current constraints configuration.
     * @param {object} performanceMetrics - Real-time performance metrics (e.g., successful_evaluations, failed_timeouts, average_latency_ms).
     * @returns {object} The updated constraints configuration or the original if the tool is missing.
     */
    calculateOptimalConstraints(currentConstraints, performanceMetrics) {
        
        if (!this.#governorTool) {
            // Fallback: If the tool is unavailable, return existing constraints.
            return currentConstraints;
        }

        return this.#delegateToGovernorExecution(currentConstraints, performanceMetrics);
    }
}