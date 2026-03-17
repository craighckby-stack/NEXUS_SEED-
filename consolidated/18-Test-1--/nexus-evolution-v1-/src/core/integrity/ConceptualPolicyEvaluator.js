/**
 * @fileoverview ConceptualPolicyEvaluator
 * Executes complex, concept-specific validation policies defined within the Concept Registry.
 * It dynamically dispatches execution requests to specific Policy Handlers registered 
 * in the ConceptualPolicyRegistry based on the constraint type, preventing monolithic logic.
 */

import { ConceptualPolicyRegistry } from './ConceptualPolicyRegistry.js';

/**
 * Executes a single conceptual constraint by looking up the appropriate handler.
 * @typedef {{ruleId: string, detail: string, severity: string}}	Violation
 * @param {Object} constraint The policy definition.
 * @param {Object} context The operational context.
 * @returns {Violation | null} The violation object if triggered, or null.
 */
function executeConstraint(constraint, context) {
    const policyType = constraint.type;
    
    // Look up the dedicated handler function from the registry
    const handler = ConceptualPolicyRegistry[policyType];

    if (!handler) {
        console.warn(`[Policy Evaluator] Unknown constraint type encountered: ${policyType}. Skipping.`);
        return {
            ruleId: 'EVAL-001',
            detail: `Unknown constraint type '${policyType}' detected during evaluation.`,
            severity: 'WARNING'
        };
    }

    try {
        // Handlers return the violation object or null if compliant.
        const result = handler(constraint, context);
        return result || null;

    } catch (e) {
        console.error(`[Policy Evaluator] Error executing constraint ${constraint.id || policyType}:`, e);
        return {
            ruleId: 'EVAL-002',
            detail: `Runtime error during execution of constraint ${constraint.id || policyType}: ${e.message}`,
            severity: 'CRITICAL'
        };
    }
}


export const ConceptualPolicyEvaluator = {

    /**
     * Executes all defined constraints and policies for a given concept against the current context.
     * @param {Object} concept The conceptual definition object (from ConceptRegistry).
     * @param {Object} context The operational context (e.g., file path, diff content, metadata).
     * @returns {{isValid: boolean, violations: Array<Violation>}}
     */
    executePolicies(concept, context) {
        let violations = [];

        // Execution logic is now purely declarative dispatch.
        if (concept.constraints && Array.isArray(concept.constraints)) {
            for (const constraint of concept.constraints) {
                const violation = executeConstraint(constraint, context);
                if (violation) {
                    violations.push(violation);
                }
            }
        }

        // Potential integration point for broader systemic checks:
        // const systemicViolations = executeSystemicPolicies(concept, context);
        // violations = violations.concat(systemicViolations);

        return {
            isValid: violations.length === 0,
            violations: violations
        };
    }
};