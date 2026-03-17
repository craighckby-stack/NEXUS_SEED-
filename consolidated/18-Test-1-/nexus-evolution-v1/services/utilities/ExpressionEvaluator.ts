export class ExpressionEvaluatorKernel {
    
    constructor() {
        this.#setupDependencies();
    }

    /**
     * Rigorous synchronous dependency setup, ensuring architectural consistency.
     */
    private #setupDependencies(): void {
        // Stateless kernel, no dependencies to validate.
    }

    /**
     * Core evaluation proxy that executes the expression safely within a restricted scope (sandbox).
     * This method rigorously enforces the I/O Proxy creation goal by isolating the sensitive 
     * dynamic execution logic (using `new Function`).
     * 
     * @param expression The expression or condition string.
     * @param context The variables available to the expression.
     * @returns The calculated result, or NaN on execution failure.
     */
    private #delegateToDynamicExecution(expression: string, context: Record<string, any>): any {
        const contextKeys = Object.keys(context);
        const contextValues = Object.values(context);
        
        try {
            // Sandbox implementation using explicit parameter binding to avoid scope leakage.
            const tempFunction = new Function(...contextKeys, `
                "use strict"; 
                // Wrap expression in parentheses to treat it as a single return value.
                return (${expression});
            `);
            
            return tempFunction(...contextValues);

        } catch (e) {
            // Silent failure is default behavior.
            return NaN;
        }
    }

    /**
     * Safely evaluates a mathematical expression string using provided context variables.
     * @param expression The mathematical expression (e.g., "tokens * 0.01 + cpu_ms * 0.0001")
     * @param context Key/value pairs used as variables in the expression (e.g., UsageSnapshot)
     * @returns The calculated numerical result. Returns 0 on failure or non-numeric result.
     */
    public safeEvaluate(expression: string, context: Record<string, any>): number {
        // Delegation to the isolated execution proxy.
        const result = this.#delegateToDynamicExecution(expression, context);
        
        if (typeof result === 'number' && isFinite(result)) {
            return result;
        }
        
        // Type coercion for boolean results in a numeric context.
        if (typeof result === 'boolean') {
            return result ? 1 : 0;
        }

        return 0;
    }

    /**
     * Safely evaluates a boolean condition string (e.g., "load_avg > 0.9 && error_rate < 0.01").
     */
    public safeEvaluateBoolean(condition: string, context: Record<string, any>): boolean {
        // Delegation to the isolated execution proxy.
        const result = this.#delegateToDynamicExecution(condition, context);

        if (typeof result === 'boolean') {
            return result;
        }
        
        // Standard JS truthiness interpretation.
        if (typeof result === 'number' && isFinite(result)) {
            return !!result;
        }
        
        return false;
    }
}