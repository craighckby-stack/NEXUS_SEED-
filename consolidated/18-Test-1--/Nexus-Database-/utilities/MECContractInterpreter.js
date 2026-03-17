class MECContractInterpreter {
    constructor(contractJson) {
        this.contract = contractJson;
        this.validateSchema();
        this.indexRules();
    }

    validateSchema() {
        // Basic structural validation ensuring ruleset and components exist
        if (!this.contract.contract_id || !Array.isArray(this.contract.ruleset) || !Array.isArray(this.contract.components)) {
            throw new Error("MEC Contract failed structural validation.");
        }
        console.log(`Contract ${this.contract.contract_id} loaded successfully.`);
    }

    indexRules() {
        this.ruleIndex = {};
        this.componentIndex = {};
        this.contract.ruleset.forEach(rule => {
            this.ruleIndex[rule.rule_id] = rule;
        });
        this.contract.components.forEach(comp => {
            this.componentIndex[comp.component_id] = comp;
        });
    }

    getRulesForComponent(componentId) {
        return this.contract.ruleset.filter(rule => rule.applies_to === componentId);
    }

    /**
     * Executes a rule based on an external execution context.
     * NOTE: Secure sandboxing is mandatory for evaluating 'condition' strings in production.
     */
    executeRule(ruleId, executionContext) {
        const rule = this.ruleIndex[ruleId];
        if (!rule) return { status: 'ERROR', message: `Rule ${ruleId} not found.` };

        const component = this.componentIndex[rule.applies_to];
        if (!component) return { status: 'ERROR', message: `Component ${rule.applies_to} not defined.` };

        const environment = { 
            ...executionContext, 
            parameters: component.parameters 
        };

        try {
            // Use a secure evaluation method (e.g., dedicated DSL or VM2) here.
            // Using eval() directly is highly insecure but demonstrates the required logic path.
            const result = eval(`((env) => { 
                const { parameters } = env; 
                return ${rule.condition}; 
            })(environment)`);

            if (result) {
                return { status: 'TRIGGERED', action: rule.action, severity: rule.severity };
            }
            return { status: 'PASS' };

        } catch (e) {
            console.error(`Error executing rule ${ruleId}:`, e);
            return { status: 'ERROR', message: 'Evaluation failed', details: e.message };
        }
    }
}