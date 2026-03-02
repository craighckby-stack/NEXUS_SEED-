/**
 * TelemetryPolicyExecutor.ts
 * Executes conditional governance responses based on vetted telemetry results.
 * Implements logic to map validation results against the Tiered Criticality Mapping
 * defined in the TelemetryVettingSpec.
 * 
 * Sovereign AGI v94.1 Intelligence Refactor: Abstracted runtime expression evaluation
 * into a dedicated utility via dependency injection (SoC enforcement).
 */

interface VettingResult {
    domain: string;
    violations: string[];
    isCritical: boolean;
    isMajor: boolean;
}

interface RejectionPolicy {
    condition: string;
    action: string;
}

interface GovernancePolicies {
    rejection_policies: RejectionPolicy[];
    default_fallback_protocol?: string;
}

interface TelemetryVettingSpec {
    governance_responses: GovernancePolicies;
    // Define other relevant sections here
}

// --- Dependency Injection Interface ---
/**
 * Required utility for safely evaluating complex policy DSLs.
 * Implemented by runtime/governance/PolicyConditionEvaluator.ts
 */
interface PolicyConditionEvaluator {
    evaluate(conditionExpression: string, context: Record<string, any>): boolean;
}

export class TelemetryPolicyExecutor {
    private policies: GovernancePolicies;
    private evaluator: PolicyConditionEvaluator;

    /**
     * @param spec The full TelemetryVettingSpec.
     * @param evaluator The required utility for policy condition evaluation.
     */
    constructor(spec: TelemetryVettingSpec, evaluator: PolicyConditionEvaluator) {
        if (!spec || !spec.governance_responses) {
            throw new Error("TelemetryPolicyExecutor: Invalid TelemetryVettingSpec provided.");
        }
        this.policies = spec.governance_responses;
        this.evaluator = evaluator;
    }

    public evaluate(results: VettingResult[]): string {
        // 1. Prepare a structured context from results
        const context = this.createEvaluationContext(results);

        // 2. Iterate through policies and check conditions
        for (const policy of this.policies.rejection_policies) {
            if (this.checkCondition(policy.condition, context)) {
                return policy.action;
            }
        }

        // 3. Fallback
        return this.policies.default_fallback_protocol || 'DEFAULT_PASS';
    }

    /**
     * Transforms VettingResults into a predictable key/value context 
     * suitable for the expression evaluator.
     * @param results The incoming vetting results.
     */
    private createEvaluationContext(results: VettingResult[]): Record<string, any> {
        const context: Record<string, any> = {};

        // Direct function equivalents (e.g., used to evaluate 'IsCriticalFailure(A1)')
        results.forEach(r => {
            context[`IsCriticalFailure(${r.domain})`] = r.isCritical;
            context[`IsMajorFailure(${r.domain})`] = r.isMajor;
        });

        // Aggregate variables for global checks (e.g., used to evaluate 'TotalCriticalFailures > 2')
        context['TotalCriticalFailures'] = results.filter(r => r.isCritical).length;
        context['AnyCriticalFailure'] = results.some(r => r.isCritical);

        return context;
    }

    /**
     * Delegates condition execution to the PolicyConditionEvaluator.
     * This ensures policy evaluation logic remains outside the policy execution workflow (SoC).
     */
    private checkCondition(condition: string, context: Record<string, any>): boolean {
        return this.evaluator.evaluate(condition, context);
    }

}