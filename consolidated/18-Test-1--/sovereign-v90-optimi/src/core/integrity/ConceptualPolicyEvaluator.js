/**
 * @fileoverview ConceptualPolicyEvaluatorKernel
 * Executes complex, concept-specific validation policies defined within the Concept Registry
 * using the injected Rule Evaluation Engine and Policy Registry.
 */

// Note: Assuming AbstractKernel and standard interfaces are available via DI context or imports.
// Placeholder definitions for architectural consistency:

/**
 * @typedef {{ruleId: string, detail: string, severity: string}} Violation
 */

// Placeholder for the Registry containing Policy Handler definitions
class IConceptualPolicyRegistryKernel {}

// Placeholder for the Tool responsible for executing specific rules/policies
class IRuleEvaluationEngineToolKernel {}

// Placeholder for the required base class
class AbstractKernel { constructor() {} }

class ConceptualPolicyEvaluatorKernel extends AbstractKernel {

    /** @type {IConceptualPolicyRegistryKernel} */
    #policyRegistry;
    
    /** @type {IRuleEvaluationEngineToolKernel} */
    #ruleEvaluationEngine;

    /**
     * @param {IConceptualPolicyRegistryKernel} policyRegistry - Source for policy handlers (replaces ConceptualPolicyRegistry).
     * @param {IRuleEvaluationEngineToolKernel} ruleEvaluationEngine - Tool for constraint execution (replaces PolicyExecutionEngine).
     */
    constructor(policyRegistry, ruleEvaluationEngine) {
        super();
        this.#policyRegistry = policyRegistry;
        this.#ruleEvaluationEngine = ruleEvaluationEngine;
        this.#setupDependencies();
    }

    /**
     * Isolates dependency validation and assignment for strict synchronous setup compliance.
     * @private
     */
    #setupDependencies() {
        if (!this.#policyRegistry || !(this.#policyRegistry instanceof IConceptualPolicyRegistryKernel)) {
            throw new Error("ConceptualPolicyEvaluatorKernel requires a valid IConceptualPolicyRegistryKernel dependency.");
        }
        if (!this.#ruleEvaluationEngine || !(this.#ruleEvaluationEngine instanceof IRuleEvaluationEngineToolKernel)) {
            throw new Error("ConceptualPolicyEvaluatorKernel requires a valid IRuleEvaluationEngineToolKernel dependency.");
        }
        // Enforce immutability
        Object.freeze(this);
    }

    /**
     * Initializes the kernel.
     * @returns {Promise<void>}
     */
    async initialize() {
        return Promise.resolve();
    }

    /**
     * Executes all defined constraints and policies for a given concept against the current context.
     * @param {Object} concept The conceptual definition object.
     * @param {Object} context The operational context.
     * @returns {Promise<{isValid: boolean, violations: Array<Violation>}>}
     */
    async executePolicies(concept, context) {
        let violations = [];

        if (concept?.constraints && Array.isArray(concept.constraints)) {
            for (const constraint of concept.constraints) {
                
                // Delegation to the injected, asynchronous Rule Evaluation Engine (replacing the global utility).
                const violation = await this.#ruleEvaluationEngine.executeRule({
                    constraint: constraint,
                    context: context,
                    // Pass the policy handler lookup table
                    ruleHandlerRegistry: this.#policyRegistry 
                });

                if (violation) {
                    violations.push(violation);
                }
            }
        }

        return {
            isValid: violations.length === 0,
            violations: violations
        };
    }
}