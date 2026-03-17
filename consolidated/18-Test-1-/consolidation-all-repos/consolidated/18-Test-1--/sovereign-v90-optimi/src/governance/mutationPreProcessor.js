/**
 * M-02 Mutation Pre-Processor Kernel (MPP)
 *
 * Role: Implements GSEP Stage 2 efficiency gate. MPP runs necessary, low-latency invariant checks
 * and fast-path compliance simulations against a proposed mutation payload before submission to
 * the P-01 Trust Calculus (Stage 3). It orchestrates rule evaluation and calculates the initial
 * Risk Index (R_INDEX) based on defined governance policies.
 *
 * Adheres strictly to AIA Enforcement Layer mandates for asynchronous operation, explicit dependency
 * management, and maximal recursive abstraction.
 */
class MutationPreProcessorKernel {
    /**
     * @param {object} dependencies
     * @param {IRuleEvaluationEngineToolKernel} dependencies.ruleEngine - Executes specific compliance rules.
     * @param {IConceptualPolicyEvaluatorKernel} dependencies.scoreEvaluator - Calculates R_INDEX based on violations.
     * @param {GovernanceSettingsRegistryKernel} dependencies.settingsRegistry - Provides general governance configuration.
     * @param {IGovernanceRuleDefinitionsRegistryKernel} dependencies.ruleDefinitionsRegistry - Provides specific rule definitions.
     * @param {MultiTargetAuditDisperserToolKernel} dependencies.auditDisperser - Handles auditable logging and error dispersal.
     */
    constructor({
        ruleEngine,
        scoreEvaluator,
        settingsRegistry,
        ruleDefinitionsRegistry,
        auditDisperser
    }) {
        if (!ruleEngine || !scoreEvaluator || !settingsRegistry || !ruleDefinitionsRegistry || !auditDisperser) {
            throw new Error("MPP Kernel initialization failed: Missing required Tool Kernels.");
        }

        this._ruleEngine = ruleEngine;
        this._scoreEvaluator = scoreEvaluator;
        this._settingsRegistry = settingsRegistry;
        this._ruleDefinitionsRegistry = ruleDefinitionsRegistry;
        this._auditDisperser = auditDisperser;

        this._isInitialized = false;
        this._passThreshold = 0.7; // Default
        this._checkDefinitions = {};
        this._invariants = {};
    }

    /**
     * Asynchronously loads configuration and initializes the kernel state.
     * Must be called before any operational method.
     */
    async initialize() {
        if (this._isInitialized) return;

        try {
            // Use Registries to securely and asynchronously load configuration
            const config = await this._settingsRegistry.getGovernanceSettings();
            const rules = await this._ruleDefinitionsRegistry.getRuleDefinitions();
            
            this._checkDefinitions = rules;
            
            // Extract necessary settings
            this._passThreshold = config.thresholds?.pass || 0.7;
            // Invariants are rules/limits provided by the config
            this._invariants = config.invariants || {};

            if (Object.keys(this._checkDefinitions).length === 0) {
                 await this._auditDisperser.audit('MPP_INIT_WARN', { message: "No governance rules defined. MPP checks will be bypassed.", level: 'WARNING' });
            }

            this._isInitialized = true;
        } catch (error) {
            await this._auditDisperser.audit('MPP_INIT_FATAL', { 
                error: error.message, 
                message: "Failed to load governance configuration during MPP initialization.",
                level: 'CRITICAL' 
            });
            throw new Error(`MutationPreProcessorKernel initialization failed: ${error.message}`);
        }
    }

    /**
     * Executes technical compliance checks and invariant enforcement.
     * @param {object} mutationPayload - The proposed code mutation payload.
     * @param {object} [context={}] - Optional context (e.g., current system state/metrics).
     * @returns {Promise<Readonly<{ R_INDEX: number, violations: ReadonlyArray<{ code: string, message: string, penalty: number }>, pass: boolean }>>}
     */
    async preProcess(mutationPayload, context = {}) {
        if (!this._isInitialized) {
             throw new Error("MutationPreProcessorKernel must be initialized before use.");
        }
        
        const checkPromises = [];

        // 1. Execute all checks concurrently
        for (const checkCode in this._checkDefinitions) {
            const ruleDefinition = this._checkDefinitions[checkCode];
            // Execute checks asynchronously
            checkPromises.push(this._executeCheck(checkCode, ruleDefinition, mutationPayload, context));
        }
        
        // Wait for all checks to complete
        const rawCheckResults = await Promise.all(checkPromises);

        // 2. Score the results using the Policy Evaluator Kernel (replacement for synchronous PenaltyScoreCalculator)
        const { R_INDEX, violations } = await this._scoreEvaluator.deriveComplianceScore(rawCheckResults);

        const result = {
            R_INDEX: R_INDEX,
            violations: Object.freeze(violations), // Ensure violations array is immutable
            pass: R_INDEX >= this._passThreshold
        };
        
        return Object.freeze(result);
    }

    /**
     * Delegates the execution of a specific governance check to the Rule Evaluation Engine.
     * @param {string} checkCode - The key for the check definition.
     * @param {object} ruleDefinition - The rule configuration.
     * @param {object} payload - The mutation payload.
     * @param {object} context - System context.
     * @returns {Promise<{ compliant: boolean, code: string, message: string, weight: number }>} 
     */
    async _executeCheck(checkCode, ruleDefinition, payload, context) {
        const defaultViolation = {
            compliant: false,
            code: checkCode,
            message: ruleDefinition.failureMessage || `Unspecified technical failure during check ${checkCode}.`,
            weight: ruleDefinition.penaltyWeight || 0.1
        };

        try {
            const checkConfig = this._invariants?.[checkCode] || {};
            
            // Delegate the logic execution to the asynchronous Rule Evaluation Engine Tool Kernel.
            const { compliant, details } = await this._ruleEngine.evaluateRule({
                ruleId: checkCode,
                targetPayload: payload,
                ruleConfig: checkConfig,
                context: context
            });

            // Output format compliant with IConceptualPolicyEvaluatorKernel input requirements
            return {
                compliant: compliant,
                code: checkCode,
                message: compliant ? "OK" : (details?.message || ruleDefinition.failureMessage),
                weight: ruleDefinition.penaltyWeight || 0
            };
            
        } catch (e) {
            // Handle technical failure during execution with auditable logging
            await this._auditDisperser.audit('MPP_RULE_EXEC_FAIL', {
                rule: checkCode,
                error: e.message,
                message: `Fatal execution error for rule ${checkCode}.`,
                level: 'ERROR'
            });
            
            // Treat execution errors as critical violations
            defaultViolation.message = `Critical Execution Failure (${e.name || 'Error'}): ${e.message}`;
            defaultViolation.weight = 1.0; 
            return defaultViolation;
        }
    }
}

module.exports = MutationPreProcessorKernel;