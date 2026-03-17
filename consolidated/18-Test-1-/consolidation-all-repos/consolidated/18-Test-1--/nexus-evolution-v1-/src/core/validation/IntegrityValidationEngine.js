const Constraints = {
    // Constraint handlers are defined statically for optimization.
    // They accept (value, pre_compiled_param).
    regex: (value, compiledRegex) => typeof value === 'string' && compiledRegex.test(value),
    minLength: (value, length) => Array.isArray(value) && value.length >= length,
    isDefined: (value) => value !== undefined && value !== null,
    // isImmutable logic is typically context-dependent (requires old state), but maintains original simple behavior.
    isImmutable: () => true, 
};

class IntegrityValidationEngine {
    
    constructor(ruleManifest) {
        // Optimization 1: Pre-compile all regexes and parameters upon initialization.
        this.manifest = IntegrityValidationEngine._compileManifestRules(ruleManifest);
        // Optimization 2: Ensure required utility is cached/minimized.
        this.jsonPath = require('./JsonPathUtility'); 
    }

    static _compileConstraint(constraintString) {
        const [type, param] = constraintString.split(':', 2);
        const handler = Constraints[type];

        if (!handler) {
            console.warn(`Unknown constraint type: ${type}`);
            return { handler: Constraints.isImmutable, arg: null }; 
        }

        let processedArg = param;
        switch (type) {
            case 'regex':
                // Compile RegExp only once.
                processedArg = new RegExp(param);
                break;
            case 'minLength':
                // Parse integer only once.
                processedArg = parseInt(param, 10);
                break;
        }

        return { handler, arg: processedArg };
    }

    static _compileManifestRules(manifest) {
        // Use a deep copy to safely modify the rule structure.
        const compiledManifest = JSON.parse(JSON.stringify(manifest)); 

        for (const operationKey in compiledManifest.rulesets) {
            const ruleset = compiledManifest.rulesets[operationKey];
            for (const rule of ruleset.rules) {
                // Attach the compiled function and parameters to the rule object.
                rule._compiledCheck = IntegrityValidationEngine._compileConstraint(rule.constraint); 
            }
        }
        return compiledManifest;
    }

    // Loads rulesets based on the operation
    loadRules(operation) {
        return this.manifest.rulesets[operation] || null;
    }

    /**
     * Executes validation against a target payload.
     * Highly optimized due to pre-compiled constraint handlers.
     */
    validate(payload, operation) {
        const ruleset = this.loadRules(operation);
        if (!ruleset) return [];

        const failures = [];
        
        for (const rule of ruleset.rules) {
            // O(1) access to pre-compiled handler and arguments
            const { handler, arg } = rule._compiledCheck; 

            // 1. Get all targeted values (handles array wildcards)
            const targets = this.jsonPath.get(payload, rule.target);

            // 2. Execute the pre-compiled constraint check against all targets
            for (const targetValue of targets) {
                // Direct function call, eliminating string parsing and switch overhead in the inner loop.
                if (!handler(targetValue, arg)) {
                    failures.push({
                        rule_id: rule.id,
                        severity: ruleset.severity,
                        message: rule.message,
                        path: rule.target
                    });
                }
            }
        }
        return failures;
    }
}

module.exports = IntegrityValidationEngine;