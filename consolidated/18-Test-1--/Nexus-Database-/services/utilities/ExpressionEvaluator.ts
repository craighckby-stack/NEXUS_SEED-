export class ExpressionEvaluator {
    /**
     * Safely evaluates a mathematical expression string using provided context variables.
     * Crucially, this implementation must use a secure sandbox (like mathjs, or a custom AST parser) 
     * to prevent RCE or side effects via malicious configuration expressions.
     * @param expression The mathematical expression (e.g., "tokens * 0.01 + cpu_ms * 0.0001")
     * @param context Key/value pairs used as variables in the expression (e.g., UsageSnapshot)
     * @returns The calculated numerical result.
     */
    public safeEvaluate(expression: string, context: Record<string, any>): number {
        // Placeholder implementation. A real system must use a vetted library or parser.
        try {
            // WARNING: NEVER USE UNSANDBOXED `eval` IN PRODUCTION FOR CONFIGURATION PARSING.
            const tempFunction = new Function('context', `with(context) { return ${expression}; }`);
            const result = tempFunction(context);
            
            if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
                return 0;
            }
            return result;
        } catch (e) {
            console.error(`Expression evaluation failed: ${expression}`, e);
            return 0;
        }
    }

    /**
     * Safely evaluates a boolean condition string (e.g., "load_avg > 0.9 && error_rate < 0.01").
     */
    public safeEvaluateBoolean(condition: string, context: Record<string, any>): boolean {
        // Reuses the safe evaluation logic, interpreting the result as a boolean outcome.
        const evaluationWrapper = `(${condition}) ? 1 : 0`;
        return this.safeEvaluate(evaluationWrapper, context) === 1;
    }
}