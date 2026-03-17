import { SecureMathEvaluator } from '../plugins/SecureMathEvaluator.js';

/**
 * Sovereign AGI - Secure Expression Evaluator
 * Safely parses and executes mathematical and logical formulas provided by CRCM or other configuration sources.
 * This utility delegates execution to a strictly sandboxed Math Evaluator plugin to prevent arbitrary code execution.
 * It operates as a stateless, static utility wrapper for secure formula processing.
 */
class SecureExpressionEvaluator {
    
    // Regex to find variables formatted as Context.VariableName, ensuring strict character validation.
    static CONTEXT_VAR_REGEX = /Context\.([A-Za-z0-9_]+)/g;

    /**
     * Delegates secure execution to the sandboxed math evaluator plugin.
     * @param {string} formula - The prepared formula string.
     * @returns {number} The evaluated result.
     * @private
     */
    static #delegateToMathEvaluator(formula) {
        // Isolated interaction with the external dependency
        return SecureMathEvaluator.execute(formula);
    }

    /**
     * Replaces Context variables in the formula with values from the context map.
     * This ensures the formula is purely mathematical before execution.
     * @param {string} formula 
     * @param {Object<string, number>} context 
     * @returns {string} The formula with variables substituted by numerical values (or 0).
     * @private
     */
    static #prepareExecutableFormula(formula, context) {
        const executionContext = context || {};

        return formula.replace(
            SecureExpressionEvaluator.CONTEXT_VAR_REGEX, 
            (match, varName) => {
                const value = executionContext[varName];
                
                // Robust safety check: Ensure substituted value is a finite number.
                // If missing, null, or invalid (NaN, Infinity), substitute 0.
                if (typeof value === 'number' && isFinite(value)) {
                    return value;
                }
                
                return 0;
            }
        );
    }

    /**
     * Executes a formula securely against a provided context map.
     * @param {string} formula - The mathematical/logical expression (e.g., 'Context.TCS * 1.5 + MAX(10, Context.Urgency)')
     * @param {Object<string, number>} context - Key-value map of runtime variables (TCS, Urgency, etc.).
     * @returns {number} The evaluated numeric result, or 0 on failure/invalid input.
     */
    static evaluate(formula, context) {
        // Input validation
        if (typeof formula !== 'string' || formula.trim() === '') {
            return 0;
        }

        try {
            // Step 1: Prepare the formula (Synchronous Data Preparation)
            const executableFormula = this.#prepareExecutableFormula(formula, context);

            // Step 2: Delegate secure execution (I/O Proxy)
            return this.#delegateToMathEvaluator(executableFormula);

        } catch (e) {
            // Use a specific prefix for high-integrity governance logging
            console.error(`AGI Kernel SECURE_EVAL_FAIL: Formula "${formula.substring(0, 80).trim()}..." failed execution. Error: ${e.message}`);
            return 0;
        }
    }
}

export { SecureExpressionEvaluator };