/**
 * M-02 Mutation Pre-Processor (MPP)
 *
 * Role: Implements GSEP Stage 2 efficiency gate. M-02 runs necessary, low-latency invariant checks
 * and fast-path compliance simulations against a proposed mutation payload before submission to
 * the P-01 Trust Calculus (Stage 3). It utilizes the RuleExecutorRegistry to delegate specific
 * compliance checks, ensuring high extensibility (OCP).
 */
class MutationPreProcessor {
    /**
     * @param {object} governanceConfig - Global governance configuration.
     * @param {RuleExecutorRegistry} ruleRegistry - Centralized registry for all executable checks.
     */
    constructor(governanceConfig, ruleRegistry) {
        if (!governanceConfig || !governanceConfig.rules) {
             throw new Error("MPP requires a valid governance configuration including compliance rules.");
        }
        if (!ruleRegistry || typeof ruleRegistry.execute !== 'function') {
             throw new Error("MPP requires a valid RuleExecutorRegistry instance.");
        }

        this.config = governanceConfig;
        this.checkDefinitions = governanceConfig.rules;
        this.ruleRegistry = ruleRegistry;
        
        // Define key thresholds
        this.PASS_THRESHOLD = governanceConfig.thresholds?.pass || 0.7;
    }

    /**
     * Executes technical compliance checks and invariant enforcement.
     * @param {object} mutationPayload - The proposed code mutation payload.
     * @param {object} [context={}] - Optional context (e.g., current system state/metrics).
     * @returns {Promise<{ R_INDEX: number, violations: Array<{ code: string, message: string, penalty: number }>, pass: boolean }>}
     */
    async preProcess(mutationPayload, context = {}) {
        const results = [];
        let totalWeightedPenalty = 0;

        // Iterate over defined rules using centralized configuration
        for (const checkCode in this.checkDefinitions) {
            const ruleDefinition = this.checkDefinitions[checkCode];
            
            // Execute the check via the registry, passing context and configuration.
            const checkResult = this._executeCheck(checkCode, ruleDefinition, mutationPayload, context);
            results.push(checkResult);
            
            if (!checkResult.compliant) {
                totalWeightedPenalty += ruleDefinition.penaltyWeight;
            }
        }

        // Penalty should be capped to prevent configuration errors from yielding R_INDEX < 0
        totalWeightedPenalty = Math.min(1.0, totalWeightedPenalty);
        
        const R_INDEX = Math.min(1.0, Math.max(0, 1.0 - totalWeightedPenalty));

        const violations = results
            .filter(r => !r.compliant)
            .map(r => ({
                code: r.code,
                message: r.message,
                penalty: r.weight 
            }));

        return {
            R_INDEX: R_INDEX,
            violations: violations,
            pass: R_INDEX >= this.PASS_THRESHOLD
        };
    }

    /**
     * Delegates the execution of a specific governance check to the RuleExecutorRegistry.
     * @param {string} checkCode - The key for the check definition.
     * @param {object} ruleDefinition - The rule configuration from governanceConfig.rules.
     * @param {object} payload - The mutation payload.
     * @param {object} context - System context.
     * @returns {{ compliant: boolean, code: string, message: string, weight: number }}
     */
    _executeCheck(checkCode, ruleDefinition, payload, context) {
        const defaultViolation = {
            compliant: false,
            code: checkCode,
            message: ruleDefinition.failureMessage || `Unspecified technical failure during check ${checkCode}.`,
            weight: ruleDefinition.penaltyWeight || 0.1
        };

        try {
            // Retrieve check-specific configuration (e.g., limits, targets) from invariants.
            const checkConfig = this.config.invariants?.[checkCode] || {};
            
            // Delegate the logic execution. The registry handles the actual implementation based on checkCode.
            const checkPassed = this.ruleRegistry.execute(checkCode, payload, checkConfig, context);

            return {
                compliant: checkPassed,
                code: checkCode,
                // Use the configured failure message only if the check fails
                message: checkPassed ? "OK" : ruleDefinition.failureMessage,
                weight: ruleDefinition.penaltyWeight || 0
            };
            
        } catch (e) {
            // Technical failure during execution (e.g., missing rule handler, configuration syntax error)
            console.error(`MPP: Fatal execution error for rule ${checkCode}:`, e);
            // Treat execution errors as critical violations
            defaultViolation.message = `Critical Execution Failure (${e.name}): ${e.message}`;
            // Ensure high penalty for critical execution failures
            defaultViolation.weight = 1.0; 
            return defaultViolation;
        }
    }
}

module.exports = MutationPreProcessor;