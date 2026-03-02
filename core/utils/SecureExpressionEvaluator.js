/**
 * Sovereign AGI - Secure Expression Evaluator
 * Safely parses and executes mathematical and logical formulas provided by CRCM or other configuration sources.
 * This utility must prevent arbitrary code execution by replacing native 'eval()' with an AST parser or a dedicated secure VM.
 */
class SecureExpressionEvaluator {
    constructor() {
        // Placeholder for initialization of secure parsing mechanisms (e.g., mathjs or custom AST parser configuration)
        this.allowedFunctions = ['MAX', 'MIN', 'ABS', 'ROUND', 'LOG'];
    }

    /**
     * Executes a formula securely against a provided context map.
     * @param {string} formula - The mathematical/logical expression (e.g., 'Context.TCS * 1.5 + MAX(10, Context.Urgency)')
     * @param {Object} context - Key-value map of runtime variables (Context.TCS, Context.Urgency, etc.)
     * @returns {number} The evaluated numeric result.
     */
    evaluate(formula, context) {
        try {
            // Step 1: Replace Context variables (e.g., Context.TCS -> 50)
            let executableFormula = formula.replace(/Context\.([^\s\)]+)/g, (match, p1) => {
                const value = context[p1];
                return (typeof value === 'number' && !isNaN(value)) ? value : 0;
            });

            // Step 2: Secure Execution Placeholder
            // WARNING: The following implementation uses the Function constructor, which is NOT fully safe against complex injection.
            // This must be replaced by a dedicated AST parser or sandboxed VM (e.g., Node's 'vm' module) in a production environment.
            const contextProxy = {
                MAX: Math.max,
                MIN: Math.min,
                ABS: Math.abs,
                ROUND: Math.round
            };
            
            // Construct function to isolate execution scope
            const evaluator = new Function('ctx', `with(ctx) { return (${executableFormula}); }`);
            return evaluator(contextProxy);

        } catch (e) {
            console.error(`Secure Expression Evaluation failed for formula "${formula}": ${e.message}`);
            return 0;
        }
    }
}

export { SecureExpressionEvaluator };