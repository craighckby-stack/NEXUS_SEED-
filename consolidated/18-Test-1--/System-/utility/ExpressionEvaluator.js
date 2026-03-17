export class ExpressionEvaluator {
    /**
     * Safely evaluates a mathematical expression string using provided context variables.
     * WARNING: The current implementation relies on `new Function()` combined with `with`, which presents significant security risks
     * (e.g., Remote Code Execution potential if inputs are not strictly controlled). This must be prioritized for secure replacement.
     * @param expression The mathematical expression (e.g., "tokens * 0.01 + cpu_ms * 0.0001")
     * @param context Key/value pairs used as variables in the expression (e.g., UsageSnapshot)
     * @returns The calculated numerical result.
     */
    safeEvaluate(expression, context) {
        try {
            // Note: The use of `new Function` is functionally necessary for this stage but highly insecure.
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
    safeEvaluateBoolean(condition, context) {
        // Reuses the safe evaluation logic, interpreting the result as a boolean outcome.
        const evaluationWrapper = `(${condition}) ? 1 : 0`;
        return this.safeEvaluate(evaluationWrapper, context) === 1;
    }
}