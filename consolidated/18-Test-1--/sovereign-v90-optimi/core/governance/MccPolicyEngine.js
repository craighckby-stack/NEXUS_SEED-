/**
 * Manages and executes Micro-Computation Credit (MCC) policies efficiently.
 * This implementation incorporates optimized rule sorting (3),
 * and leverages IDeclarativePolicyConditionEvaluator for recursive condition checks (5).
 * Prefix/Range matching (1 & 2) is assumed to be handled by the injected PolicyRuleMatcherTool.
 */

// NOTE: DeclarativePolicyConditionEvaluator should be instantiated and injected
import { DeclarativePolicyConditionEvaluator } from './plugins'; 
import { PolicyRuleMatcherTool } from './policy/PolicyRuleMatcherTool'; 
import { SchemaCompilerAndValidator } from '../schema/SchemaCompilerAndValidator'; 

/**
 * Defines the structure for a Micro-Computation Credit Policy.
 */
type PolicyDefinition = {
    id: string;
    priority: number; // For sorting
    scope: 'prefix' | 'range' | 'exact';
    matchKey: string;
    conditions: any; // Nested declarative conditions
    action: 'ALLOW' | 'DENY' | 'AUDIT';
    rateLimitConfig?: any; // placeholder
};

/**
 * Interface definition for the dedicated condition evaluation tool/plugin.
 */
interface IDeclarativePolicyConditionEvaluator {
    execute(args: { data: any, policyConditions: any }): boolean;
}

class MccPolicyEngine {
    #policies: PolicyDefinition[] = [];
    #policyMatcher: PolicyRuleMatcherTool;
    #conditionEvaluator: IDeclarativePolicyConditionEvaluator;
    #schemaValidator: SchemaCompilerAndValidator;

    /**
     * @param policyMatcher Tool for efficient rule indexing and matching.
     * @param conditionEvaluator Plugin responsible for complex declarative condition checking.
     * @param schemaValidator Tool for policy schema validation (retained for potential future use).
     */
    constructor(
        policyMatcher: PolicyRuleMatcherTool,
        conditionEvaluator: IDeclarativePolicyConditionEvaluator, // Now required injection
        schemaValidator: SchemaCompilerAndValidator,
    ) {
        this.#setupDependencies(policyMatcher, conditionEvaluator, schemaValidator);
    }

    /**
     * Encapsulates dependency assignment.
     */
    #setupDependencies(policyMatcher: PolicyRuleMatcherTool, conditionEvaluator: IDeclarativePolicyConditionEvaluator, schemaValidator: SchemaCompilerAndValidator): void {
        this.#conditionEvaluator = conditionEvaluator;
        this.#policyMatcher = policyMatcher;
        this.#schemaValidator = schemaValidator;
    }

    /**
     * I/O Proxy: Delegates to PolicyRuleMatcherTool to compile lookup structures.
     */
    #compileMatchingRules(rawPolicies: PolicyDefinition[]): void {
        this.#policyMatcher.compileRules(rawPolicies);
    }

    /**
     * Synchronous Setup: Sorts policies based on priority.
     */
    #preparePolicies(rawPolicies: PolicyDefinition[]): void {
        // Optimization 3: Sort a copy of policies based on explicit priority (high priority first) to minimize evaluation steps.
        // Using spread syntax ([...rawPolicies]) ensures we do not mutate the array passed by the caller.
        this.#policies = [...rawPolicies].sort((a, b) => b.priority - a.priority);
    }

    /**
     * Step 3: Initialize and sort policies based on priority.
     */
    public initializeEngine(rawPolicies: PolicyDefinition[]): void {
        if (!rawPolicies || rawPolicies.length === 0) {
            this.#policies = [];
            return;
        }

        this.#compileMatchingRules(rawPolicies);
        this.#preparePolicies(rawPolicies);

        console.log(`MccPolicyEngine initialized with ${this.#policies.length} prioritized policies.`);
    }

    /**
     * I/O Proxy: Delegates to PolicyRuleMatcherTool to find relevant policies.
     */
    #findMatchingPolicies(resourceId: string): PolicyDefinition[] {
        // Step 4a: Find matching policies using efficient structures (Trie/Interval Tree abstraction).
        return this.#policyMatcher.findMatchingRules(resourceId, this.#policies);
    }

    /**
     * I/O Proxy: Delegates evaluation to the specialized condition evaluator plugin (Step 5).
     */
    #delegateToConditionEvaluator(contextData: any, policyConditions: any): boolean {
        return this.#conditionEvaluator.execute({
            data: contextData,
            policyConditions: policyConditions
        });
    }

    /**
     * Step 4 & 5: Optimized policy evaluation using sorted rules and recursive evaluation.
     */
    public evaluateTransaction(transaction: { resourceId: string, value: number, context: any }): 'ALLOW' | 'DENY' | 'AUDIT' | null {
        if (!transaction || !transaction.resourceId) {
            return 'DENY'; 
        }

        const matchingPolicies = this.#findMatchingPolicies(transaction.resourceId);

        // Iterate through matching policies in order of pre-sorted priority (Step 4b)
        for (const policy of matchingPolicies) {
            // Combine transaction details and context for full evaluation scope
            const contextData = { ...transaction, ...transaction.context };
            
            const conditionsMet = this.#delegateToConditionEvaluator(contextData, policy.conditions);

            if (conditionsMet) {
                // Return the action of the highest priority rule that meets its conditions.
                return policy.action; 
            }
        }

        return null;
    }
}