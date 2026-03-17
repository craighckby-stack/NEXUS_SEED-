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
    private schemaValidator: { execute: (args: { data: any; schema: any }) => { isValid: boolean; errors?: any[] } };
    private expressionEvaluator: { execute: (args: { expression: string; context: Record<string, any> }) => boolean };

    constructor(
        contractJson: Contract,
        schemaValidator: { execute: (args: { data: any; schema: any }) => { isValid: boolean; errors?: any[] } },
        expressionEvaluator: { execute: (args: { expression: string; context: Record<string, any> }) => boolean }
    ) {
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
            const errors = validationResult.errors?.map(e => 
                typeof e === 'string' ? e : e.message || 'Unknown error'
            ).join('; ') || 'Unknown schema validation errors';
            
            throw new Error(`MEC Contract failed structural validation: ${errors}`);
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
     * @param ruleId - The ID of the rule to execute
     * @param executionContext - The context in which to evaluate the rule
     * @returns An object containing the execution status and related information
     */
    public executeRule(ruleId: string, executionContext: ExecutionContext): { 
        status: 'TRIGGERED' | 'PASS' | 'ERROR'; 
        message?: string; 
        action?: string; 
        severity?: string; 
        details?: string 
    } {
        const rule = this.ruleIndex[ruleId];
        if (!rule) return { status: 'ERROR', message: `Rule ${ruleId} not found.` };

        const component = this.componentIndex[rule.applies_to];
        if (!component) return { status: 'ERROR', message: `Component ${rule.applies_to} not defined.` };

        const environment: Record<string, any> = { 
            ...executionContext, 
            parameters: component.parameters 
        };

        try {
            const conditionMet = this.expressionEvaluator.execute({
                expression: rule.condition,
                context: environment
            });

            return conditionMet 
                ? { status: 'TRIGGERED', action: rule.action, severity: rule.severity }
                : { status: 'PASS' };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { status: 'ERROR', message: 'Evaluation failed', details: errorMessage };
        }
    }
}
