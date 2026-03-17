interface SecurePolicyEvaluatorTool {
    execute(args: { conditionExpression: string; context: Record<string, unknown> }): boolean;
}

/**
 * Evaluates policy condition expressions using a sandboxed evaluator.
 * Provides a secure and isolated environment for evaluating complex policy conditions.
 */
export class PolicyConditionEvaluatorKernel {
    private readonly SECURE_EVALUATOR_DEPENDENCY_ERROR = "SecurePolicyEvaluatorTool dependency is required for safe policy evaluation.";
    
    private readonly secureEvaluator: SecurePolicyEvaluatorTool;

    /**
     * Creates a new PolicyConditionEvaluatorKernel.
     * @param secureEvaluator - The sandboxed evaluator to use for condition execution.
     * @throws {Error} If secureEvaluator is not provided.
     */
    constructor(secureEvaluator: SecurePolicyEvaluatorTool) {
        if (!secureEvaluator) {
            throw new Error(this.SECURE_EVALUATOR_DEPENDENCY_ERROR);
        }
        this.secureEvaluator = secureEvaluator;
    }

    /**
     * Evaluates a condition expression against the given context.
     * @param conditionExpression - The policy condition to evaluate.
     * @param context - The data context to evaluate against.
     * @returns The evaluation result, or false if evaluation fails.
     */
    public evaluate(conditionExpression: string, context: Record<string, unknown>): boolean {
        try {
            return this.secureEvaluator.execute({ conditionExpression, context });
        } catch (error) {
            console.error(`Error evaluating condition '${conditionExpression}':`, error);
            return false;
        }
    }
}
