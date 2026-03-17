interface Rule {
    rule_id: string;
    applies_to: string;
    condition: string;
    action: string;
    severity: string;
}

interface Component {
    component_id: string;
    parameters: Record<string, any>;
}

interface Contract {
    contract_id: string;
    ruleset: Rule[];
    components: Component[];
}

interface ExecutionContext extends Record<string, any> {}

const MEC_CONTRACT_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
        contract_id: { type: "string" },
        ruleset: { type: "array" },
        components: { type: "array" }
    },
    required: ["contract_id", "ruleset", "components"]
};

class MECContractInterpreter {
    private contract: Contract;
    private ruleIndex: Record<string, Rule> = {};
    private componentIndex: Record<string, Component> = {};
    private schemaValidator;
    private expressionEvaluator;

    constructor(
        contractJson: Contract,
        schemaValidator: any, // SchemaValidationService
        expressionEvaluator: any // SecureExpressionEvaluatorTool
    ) {
        // AGI-KERNEL Dependency Validation: Immediate TypeError on invalid shape
        if (!schemaValidator || typeof schemaValidator.execute !== 'function') {
            throw new TypeError("MECContractInterpreter requires a valid SchemaValidationService dependency with an 'execute' function.");
        }
        if (!expressionEvaluator || typeof expressionEvaluator.execute !== 'function') {
            throw new TypeError("MECContractInterpreter requires a valid SecureExpressionEvaluatorTool dependency with an 'execute' function.");
        }

        this.schemaValidator = schemaValidator;
        this.expressionEvaluator = expressionEvaluator;
        this.contract = contractJson;
        
        this.validateSchema();
        this.indexRules();
    }

    private validateSchema() {
        const validationResult = this.schemaValidator.execute({
            data: this.contract,
            schema: MEC_CONTRACT_SCHEMA
        });

        if (!validationResult.isValid) {
            const errors = validationResult.errors.map(e => (typeof e === 'string' ? e : e.message || 'Unknown error')).join('; ');
            
            // Use CanonicalErrorFactory for standardized initialization failure reporting
            throw CanonicalErrorFactory.create('ContractInitializationError', {
                message: `MEC Contract failed structural validation during initialization.`,
                details: errors,
                code: 'CONTRACT_SCHEMA_INVALID'
            });
        }
    }

    private indexRules() {
        this.contract.ruleset.forEach(rule => {
            this.ruleIndex[rule.rule_id] = rule;
        });
        this.contract.components.forEach(comp => {
            this.componentIndex[comp.component_id] = comp;
        });
    }

    public getRulesForComponent(componentId: string): Rule[] {
        return this.contract.ruleset.filter(rule => rule.applies_to === componentId);
    }

    /**
     * Executes a rule based on an external execution context, using a secure evaluation tool.
     */
    public executeRule(ruleId: string, executionContext: ExecutionContext): { status: string, message?: string, action?: string, severity?: string, details?: string } {
        const rule = this.ruleIndex[ruleId];
        if (!rule) return { status: 'ERROR', message: `Rule ${ruleId} not found.` };

        const component = this.componentIndex[rule.applies_to];
        if (!component) return { status: 'ERROR', message: `Component ${rule.applies_to} not defined.` };

        // Construct the isolated execution environment
        const environment: Record<string, any> = { 
            ...executionContext, 
            parameters: component.parameters 
        };

        try {
            const result = this.expressionEvaluator.execute({
                expression: rule.condition,
                context: environment
            });

            if (result) {
                return { status: 'TRIGGERED', action: rule.action, severity: rule.severity };
            }
            return { status: 'PASS' };

        } catch (e) {
            const error = e as Error;
            // Standardized error return
            return { status: 'ERROR', message: 'Evaluation failed', details: error.message || String(error) };
        }
    }
}