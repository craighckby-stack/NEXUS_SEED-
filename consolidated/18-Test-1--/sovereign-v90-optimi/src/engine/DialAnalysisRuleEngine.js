/**
 * AGI-KERNEL v7.11.3 - DialAnalysisRuleEngineKernel
 * Handles specialized rule compilation, prefix indexing, and delegates execution
 * to an injected IRuleEvaluationEngineToolKernel.
 */
class DialAnalysisRuleEngineKernel {
    #ruleSets;
    #ruleEvaluationEngine;
    #logger;

    /**
     * @param {object} dependencies
     * @param {IRuleEvaluationEngineToolKernel} dependencies.ruleEvaluationEngine - Tool for executing individual rules.
     * @param {ILoggerToolKernel} dependencies.logger - Tool for logging warnings and errors.
     */
    constructor(dependencies) {
        this.#ruleSets = new Map();
        this.#setupDependencies(dependencies);
    }

    /**
     * Strictly validates and assigns required strategic dependencies.
     * Ensures the synchronous setup extraction mandate is satisfied.
     * @param {object} dependencies 
     */
    #setupDependencies(dependencies) {
        if (!dependencies.ruleEvaluationEngine) {
            throw new Error('DialAnalysisRuleEngineKernel: Missing required dependency: ruleEvaluationEngine (IRuleEvaluationEngineToolKernel).');
        }
        if (!dependencies.logger) {
            throw new Error('DialAnalysisRuleEngineKernel: Missing required dependency: logger (ILoggerToolKernel).');
        }
        this.#ruleEvaluationEngine = dependencies.ruleEvaluationEngine;
        this.#logger = dependencies.logger;
    }

    /**
     * Initializes the kernel by compiling and indexing the provided rules.
     * This satisfies the mandate for asynchronous initialization of strategic data.
     * @param {Array<Object>} rawRules - Array of rule definitions.
     * @returns {Promise<void>}
     */
    async initialize(rawRules) {
        if (!Array.isArray(rawRules)) {
             this.#logger.warn('DialAnalysisRuleEngineKernel initialized without rules array.');
             return;
        }
        this.#compileRules(rawRules);
    }

    /**
     * Pre-processes and indexes raw rules for fast lookup using prefix optimization.
     * Pre-compiles regex strings into RegExp objects.
     * @param {Array<Object>} rawRules 
     */
    #compileRules(rawRules) {
        rawRules.forEach(rule => {
            // 1. Pre-compile Regex object if present
            if (rule.regex && typeof rule.regex === 'string') {
                try {
                    // Store the compiled regex on the rule object itself for reuse
                    rule._compiledRegex = new RegExp(rule.regex);
                } catch (e) {
                    this.#logger.warn(`[DialAnalysisRuleEngineKernel] Skipping invalid regex in rule ${rule.id || 'unknown'}: ${e.message}`);
                    return; 
                }
            }
            
            // 2. Determine indexing key (prefix up to 3 chars or 'default')
            const prefix = rule.prefix ? String(rule.prefix).substring(0, 3) : 'default';

            if (!this.#ruleSets.has(prefix)) {
                this.#ruleSets.set(prefix, []);
            }
            this.#ruleSets.get(prefix).push(rule);
        });
    }

    /**
     * Analyzes a dial string against all rules using prefix optimization.
     * Core logic is now asynchronous, aligning with strategic execution mandates.
     * @param {string} dialString
     * @returns {Promise<{input: string, normalized: string, match: boolean, ruleId?: string, metadata?: Object}>}
     */
    async analyze(dialString) {
        if (!dialString) return { input: '', normalized: '', match: false };
        
        // Step 1: Normalize input (remove non-dialing characters immediately)
        const normalizedDial = String(dialString).replace(/[^0-9+*#]/g, '');

        // Step 2: Select candidate rule sets based on prefix (highly efficient lookup)
        const prefixKey = normalizedDial.substring(0, Math.min(3, normalizedDial.length)) || 'default';
        
        // Combine specific prefix rules with any 'default' global rules
        const candidateRules = [
            ...(this.#ruleSets.get(prefixKey) || []),
            ...(prefixKey !== 'default' ? (this.#ruleSets.get('default') || []) : [])
        ];

        // Step 3: Execute rules sequentially using the abstracted executor
        for (const rule of candidateRules) {
            try {
                // The injected ruleEvaluationEngine handles the actual execution logic.
                const result = await this.#ruleEvaluationEngine.execute(normalizedDial, rule);
                
                if (result.match) {
                    return {
                        input: dialString,
                        normalized: normalizedDial,
                        match: true,
                        ruleId: rule.id,
                        metadata: result.metadata || rule.metadata,
                    };
                }
            } catch (error) {
                this.#logger.error(`[DialAnalysisRuleEngineKernel] Failed to execute rule ID ${rule.id}:`, error);
            }
        }

        return { input: dialString, normalized: normalizedDial, match: false };
    }
}