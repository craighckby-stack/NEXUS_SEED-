const JsonPathUtility = require('./JsonPathUtility');

/**
 * NOTE: ConstraintStrategies should ideally be managed by a separate Registry
 * component to allow for runtime extension and modularity. Temporarily defined
 * locally pending scaffolding of ConstraintStrategyRegistry.js.
 */
const ConstraintStrategies = {
    regex: (value, param, state) => state.regex.test(value),
    min_length: (value, param) => (Array.isArray(value) || typeof value === 'string') && value.length >= parseInt(param),
    is_defined: (value) => value !== undefined && value !== null,
    // is_immutable requires comparison against original state context, assumed true for current implementation scope.
    is_immutable: () => true,
};

class IntegrityValidationEngine {
    constructor(ruleManifest) {
        // ruleManifest is loaded from spec/integrity/mcis_v1.2.json
        this.manifest = ruleManifest;
        // Utilize the utility; ensure external registration if the system grows.
        this.jsonPath = JsonPathUtility;
        this.compiledRulesCache = {};
    }

    /**
     * Parses and compiles a raw constraint string into an executable validation object.
     * Regex constraints are pre-compiled for performance.
     */
    _compileConstraint(constraintString) {
        const [type, ...rest] = constraintString.split(':');
        const param = rest.join(':');

        const strategy = ConstraintStrategies[type];

        if (!strategy) {
            console.warn(`[IntegrityEngine] Unknown constraint type encountered: ${type}. Failing safe (pass).`);
            return { type, param, check: () => true, state: {} };
        }

        let state = {};
        if (type === 'regex') {
            // Compile the regex once upon loading the rule.
            try {
                state.regex = new RegExp(param);
            } catch (e) {
                console.error(`Invalid regex parameter for rule: ${param}`, e);
                return { type, param, check: () => false, state: {} }; // Fail fast on invalid regex
            }
        }

        return { type, param, check: (value) => strategy(value, param, state), state };
    }

    /**
     * Loads rulesets based on the operation and caches compiled versions.
     */
    loadRules(operation) {
        if (this.compiledRulesCache[operation]) {
            return this.compiledRulesCache[operation];
        }

        const rawRuleset = this.manifest.rulesets[operation];
        if (!rawRuleset) return null;

        const compiledRuleset = {
            ...rawRuleset,
            rules: rawRuleset.rules.map(rule => ({
                ...rule,
                compiledConstraint: this._compileConstraint(rule.constraint)
            }))
        };

        this.compiledRulesCache[operation] = compiledRuleset;
        return compiledRuleset;
    }

    /**
     * Creates a detailed failure object for standardized reporting.
     */
    _createFailure(rule, severity, value) {
        // Truncate long values for logging clarity but retain type/path information
        const displayValue = (value === undefined || value === null) 
            ? 'N/A' 
            : (typeof value === 'object' ? JSON.stringify(value) : String(value));

        const actual_value = displayValue.length > 256 
            ? displayValue.substring(0, 253) + '...'
            : displayValue;

        return {
            rule_id: rule.id,
            severity: severity,
            message: rule.message,
            path: rule.target,
            constraint_type: rule.compiledConstraint.type,
            actual_value: actual_value
        };
    }

    /**
     * Executes validation against a target payload.
     * @param {object} payload - The object being validated.
     * @param {string} operation - The ruleset key ('creation_validation', etc.).
     * @returns {Array<object>} - List of failed constraints.
     */
    validate(payload, operation) {
        const ruleset = this.loadRules(operation);
        if (!ruleset) return [];

        const failures = [];

        for (const rule of ruleset.rules) {
            const { target, compiledConstraint } = rule;
            
            // 1. Get all targeted values (JSON Path query)
            const targets = this.jsonPath.get(payload, target);

            // If JSONPath resolves to an empty array (path not found/list empty),
            // this is a failure only if the constraint explicitly checks for presence.
            if (targets.length === 0) {
                 if (compiledConstraint.type === 'is_defined') {
                      // Failed definition check because the path resolved to nothing in the payload structure.
                      failures.push(this._createFailure(rule, ruleset.severity, undefined));
                 }
                 continue;
            }

            for (const targetValue of targets) {
                // 2. Execute pre-compiled constraint check
                if (!compiledConstraint.check(targetValue)) {
                    failures.push(this._createFailure(rule, ruleset.severity, targetValue));
                }
            }
        }
        return failures;
    }
}

module.exports = IntegrityValidationEngine;