/**
 * TelemetryPolicyExecutorKernel.ts
 * Executes conditional governance responses based on vetted telemetry results.
 * Implements logic to map validation results against the Tiered Criticality Mapping
 * defined in the TelemetryVettingSpec.
 *
 * Refactored to adhere to AGI-KERNEL standards: synchronous setup extraction, state
 * privatization, and rigorous I/O proxy creation.
 */

// --- Telemetry Domain Interfaces ---
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
}

// --- Dependency Injection Interface ---
/**
 * Required utility for safely evaluating complex policy DSLs.
 * Implemented by runtime/governance/PolicyConditionEvaluator.ts
 */
interface PolicyConditionEvaluator {
    evaluate(conditionExpression: string, context: Record<string, unknown>): boolean;
}

// Assumed access to the global PolicyRuleMatcherTool defined in the plugin layer.
declare const PolicyRuleMatcherTool: {
    execute(args: {
        policies: RejectionPolicy[];
        context: Record<string, unknown>;
        evaluator: (condition: string, ctx: Record<string, unknown>) => boolean;
        defaultAction: string;
    }): string;
};

/**
 * Constants used in the policy execution
 */
const POLICY_CONSTANTS = {
    DEFAULT_ACTION: 'DEFAULT_PASS',
    CONTEXT_PREFIXES: {
        CRITICAL_FAILURE: 'IsCriticalFailure(',
        MAJOR_FAILURE: 'IsMajorFailure(',
    },
} as const;

/**
 * Core class for executing telemetry governance policies.
 */
export class TelemetryPolicyExecutorKernel {
    #policies: GovernancePolicies;
    #evaluator: PolicyConditionEvaluator;

    /**
     * Initializes the policy executor with governance specifications and an evaluator.
     * @param spec - The full TelemetryVettingSpec containing governance policies.
     * @param evaluator - The utility for evaluating policy conditions.
     * @throws {Error} If the provided spec or evaluator is invalid.
     */
    constructor(spec: TelemetryVettingSpec, evaluator: PolicyConditionEvaluator) {
        this.#setupDependencies(spec, evaluator);
    }

    /**
     * Validates and assigns all required internal dependencies and configuration.
     * @param spec - The TelemetryVettingSpec to validate.
     * @param evaluator - The PolicyConditionEvaluator to validate.
     * @throws {Error} If validation fails.
     */
    #setupDependencies(spec: TelemetryVettingSpec, evaluator: PolicyConditionEvaluator): void {
        if (!this.#isValidSpec(spec)) {
            throw new Error("Invalid TelemetryVettingSpec provided. Missing spec or governance_responses.");
        }

        if (!this.#isValidEvaluator(evaluator)) {
            throw new Error("Invalid PolicyConditionEvaluator provided (missing or invalid 'evaluate' function).");
        }

        this.#policies = spec.governance_responses;
        this.#evaluator = evaluator;
    }

    /**
     * Validates the TelemetryVettingSpec.
     * @param spec - The specification to validate.
     * @returns True if valid, false otherwise.
     */
    #isValidSpec(spec: unknown): spec is TelemetryVettingSpec {
        return (
            spec &&
            typeof spec === 'object' &&
            'governance_responses' in spec &&
            Array.isArray((spec as TelemetryVettingSpec).governance_responses.rejection_policies)
        );
    }

    /**
     * Validates the PolicyConditionEvaluator.
     * @param evaluator - The evaluator to validate.
     * @returns True if valid, false otherwise.
     */
    #isValidEvaluator(evaluator: unknown): evaluator is PolicyConditionEvaluator {
        return (
            evaluator &&
            typeof evaluator === 'object' &&
            'evaluate' in evaluator &&
            typeof (evaluator as PolicyConditionEvaluator).evaluate === 'function'
        );
    }

    /**
     * Transforms VettingResults into a predictable key/value context
     * suitable for the expression evaluator.
     * @param results - The incoming vetting results.
     * @returns A structured context object.
     */
    #createEvaluationContext(results: VettingResult[]): Record<string, unknown> {
        const context: Record<string, unknown> = {};

        results.forEach(result => {
            context[`${POLICY_CONSTANTS.CONTEXT_PREFIXES.CRITICAL_FAILURE}${result.domain})`] = result.isCritical;
            context[`${POLICY_CONSTANTS.CONTEXT_PREFIXES.MAJOR_FAILURE}${result.domain})`] = result.isMajor;
        });

        context['TotalCriticalFailures'] = results.filter(r => r.isCritical).length;
        context['AnyCriticalFailure'] = results.some(r => r.isCritical);

        return context;
    }

    /**
     * Delegates condition evaluation using the injected evaluator tool.
     * @param condition - The condition expression to evaluate.
     * @param context - The evaluation context.
     * @returns The evaluation result.
     */
    #delegateToEvaluator(condition: string, context: Record<string, unknown>): boolean {
        return this.#evaluator.evaluate(condition, context);
    }

    /**
     * Delegates policy matching and execution lookup to the external PolicyRuleMatcherTool.
     * @param context - The evaluation context.
     * @returns The determined governance action string.
     */
    #delegateToPolicyMatcher(context: Record<string, unknown>): string {
        return PolicyRuleMatcherTool.execute({
            policies: this.#policies.rejection_policies,
            context,
            evaluator: this.#delegateToEvaluator.bind(this),
            defaultAction: this.#policies.default_fallback_protocol ?? POLICY_CONSTANTS.DEFAULT_ACTION,
        });
    }

    /**
     * Evaluates vetting results against governance policies to determine the appropriate response action.
     * @param results - The incoming vetting results.
     * @returns The determined governance action string.
     */
    public evaluate(results: VettingResult[]): string {
        const context = this.#createEvaluationContext(results);
        return this.#delegateToPolicyMatcher(context);
    }
}
