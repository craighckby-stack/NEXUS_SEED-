/**
 * AxiomRuleValidatorKernel
 * Handles runtime loading, validation, and enforcement processing of GAX Axioms.
 * This module acts as the runtime enforcement engine for all governance axioms.
 */
class AxiomRuleValidatorKernel {
    #specValidator;
    #logger;
    #ruleEvaluationEngine;
    #configRegistry;
    
    /** @type {Map<string, object>} */
    #activeAxioms;

    /**
     * @param {object} dependencies
     * @param {ISpecValidatorKernel} dependencies.specValidator
     * @param {ILoggerToolKernel} dependencies.logger
     * @param {IRuleEvaluationEngineToolKernel} dependencies.ruleEvaluationEngine
     * @param {IAxiomDefinitionConfigRegistryKernel} dependencies.configRegistry
     */
    constructor(dependencies) {
        this.#activeAxioms = new Map(); // Key: axiomId_vX
        this.#setupDependencies(dependencies);
    }

    /**
     * Strictly isolates synchronous dependency resolution and initialization logic.
     * @param {object} dependencies
     * @throws {Error} If mandatory dependencies are missing or schema compilation fails.
     */
    #setupDependencies(dependencies) {
        if (!dependencies.specValidator) {
            throw new Error("AxiomRuleValidatorKernel: Dependency ISpecValidatorKernel missing.");
        }
        if (!dependencies.logger) {
            throw new Error("AxiomRuleValidatorKernel: Dependency ILoggerToolKernel missing.");
        }
        if (!dependencies.ruleEvaluationEngine) {
            throw new Error("AxiomRuleValidatorKernel: Dependency IRuleEvaluationEngineToolKernel missing.");
        }
        if (!dependencies.configRegistry) {
            throw new Error("AxiomRuleValidatorKernel: Dependency IAxiomDefinitionConfigRegistryKernel missing.");
        }

        this.#specValidator = dependencies.specValidator;
        this.#logger = dependencies.logger;
        this.#ruleEvaluationEngine = dependencies.ruleEvaluationEngine;
        this.#configRegistry = dependencies.configRegistry;

        // --- Original Constructor Logic: Schema Compilation ---
        const AXIOM_SCHEMA_ID = this.#configRegistry.getAxiomSchemaId();
        const AxiomSchema = this.#configRegistry.getAxiomSchemaDefinition();
        
        try {
            // Compile schema using the injected tool
            this.#specValidator.compileSchema(AXIOM_SCHEMA_ID, AxiomSchema);
        } catch (error) {
            this.#logger.error('FATAL: Failed to compile Axiom Definition Schema. Governance checks may be bypassed.', { error, schemaId: AXIOM_SCHEMA_ID });
            // Re-throw to prevent instantiation of a broken kernel
            throw new Error(`FATAL: Axiom Schema compilation failed for ID ${AXIOM_SCHEMA_ID}.`);
        }
        
        this.#logger.debug(`Successfully compiled Axiom Schema ID: ${AXIOM_SCHEMA_ID}`);
    }

    /**
     * Loads a new axiom definition and verifies it against the schema.
     * @param {object} axiomDefinition - The definition payload.
     * @returns {boolean} True if loaded successfully and is active.
     */
    loadAxiom(axiomDefinition) {
        const AXIOM_SCHEMA_ID = this.#configRegistry.getAxiomSchemaId();
        
        const validationResult = this.#specValidator.validate(AXIOM_SCHEMA_ID, axiomDefinition);
        
        if (!validationResult.isValid) {
            const axiomId = (axiomDefinition).axiomId || 'Unknown';
            this.#logger.error(`Axiom Validation Failed for ${axiomId}:`, validationResult.errors);
            return false;
        }

        const axiom = axiomDefinition;
        
        if (axiom.status !== 'ACTIVE') {
            this.#logger.debug(`Skipping inactive axiom: ${axiom.axiomId} (Status: ${axiom.status})`);
            return true;
        }

        const key = `${axiom.axiomId}_v${axiom.version}`;
        this.#activeAxioms.set(key, axiom);
        this.#logger.info(`Loaded and activated axiom: ${key} (${axiom.metadata.category})`);
        return true;
    }

    /**
     * Evaluates a context against all applicable loaded axioms.
     * The method is now asynchronous to accommodate the IRuleEvaluationEngineToolKernel interface.
     * @param {string} scopeIdentifier - The identifier matching the rule scope (e.g., file path, component ID).
     * @param {object} contextData - Data object (e.g., AST, configuration tree) to test against the rule condition.
     * @returns {Promise<Array<object>>} List of enforcement actions required.
     */
    async enforce(scopeIdentifier, contextData) {
        const enforcementActions = [];

        for (const [key, axiom] of this.#activeAxioms.entries()) {
            // 1. Scope Check
            if (axiom.ruleDefinition.scope.includes(scopeIdentifier)) {
                
                // 2. Condition Evaluation using the injected RuleEvaluationEngine
                const isViolation = await this.#ruleEvaluationEngine.evaluate(
                    axiom.definitionType,
                    axiom.ruleDefinition.condition,
                    contextData
                );
                
                if (isViolation) {
                    this.#logger.warn(`Axiom violation detected: ${key} in scope ${scopeIdentifier}`);
                    
                    const actionPayload = {
                        axiomId: axiom.axiomId,
                        version: axiom.version,
                        action: axiom.ruleDefinition.action,
                        scope: scopeIdentifier
                    };
                    enforcementActions.push(actionPayload);

                    if (axiom.ruleDefinition.action.type === 'ENFORCE_STOP') {
                        // Immediate halt mechanism for critical axioms
                        throw new Error(`Critical Axiom Violation [${axiom.axiomId}]: Enforcement required. Action: ${JSON.stringify(actionPayload)}`);
                    }
                }
            }
        }
        return enforcementActions;
    }
}

export { AxiomRuleValidatorKernel };