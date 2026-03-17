/**
 * @interface IIntegrityRulesManifestRegistryKernel
 * Defines the interface for retrieving integrity rule manifests.
 */

/**
 * @interface IConstraintCompilerToolKernel
 * Defines the interface for compiling raw constraints into executable functions.
 * Must expose a method `compile(constraint: string): { type: string, check: Function }`
 */

/**
 * @interface IJsonPathQueryToolKernel
 * Defines the interface for performing JSON Path queries.
 * Must expose a method `get(payload: object, path: string): Array<any>`
 */

/**
 * IntegrityValidationEngineKernel manages the loading, caching, and application of integrity rules
 * against a payload, relying on injected tools for constraint compilation and path traversal.
 */
class IntegrityValidationEngineKernel {
    /**
     * @param {object} dependencies - Kernel dependencies.
     * @param {IIntegrityRulesManifestRegistryKernel} dependencies.integrityRulesManifestRegistry
     * @param {IConstraintCompilerToolKernel} dependencies.constraintCompilerTool
     * @param {IJsonPathQueryToolKernel} dependencies.jsonPathQueryTool
     * @param {ILoggerToolKernel} dependencies.loggerTool
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
        
        /** @type {object | null} */
        this.manifest = null;
        /** @type {Object<string, object>} */
        this.compiledRulesCache = {};
    }

    /**
     * Rigorously validates and assigns dependencies.
     * @param {object} dependencies
     * @private
     */
    #setupDependencies(dependencies) {
        if (!dependencies) {
            throw new Error("Dependencies must be provided to IntegrityValidationEngineKernel.");
        }
        const { integrityRulesManifestRegistry, constraintCompilerTool, jsonPathQueryTool, loggerTool } = dependencies;

        if (!integrityRulesManifestRegistry || typeof integrityRulesManifestRegistry.getManifest !== 'function') {
            throw new Error("IntegrityRulesManifestRegistry (IIntegrityRulesManifestRegistryKernel) dependency is missing or invalid.");
        }
        if (!constraintCompilerTool || typeof constraintCompilerTool.compile !== 'function') {
            throw new Error("ConstraintCompilerTool (IConstraintCompilerToolKernel) dependency is missing or invalid.");
        }
        if (!jsonPathQueryTool || typeof jsonPathQueryTool.get !== 'function') {
            throw new Error("JsonPathQueryTool (IJsonPathQueryToolKernel) dependency is missing or invalid.");
        }
        if (!loggerTool || typeof loggerTool.error !== 'function') {
            throw new Error("LoggerTool (ILoggerToolKernel) dependency is missing or invalid.");
        }

        this.integrityRulesManifestRegistry = integrityRulesManifestRegistry;
        this.constraintCompilerTool = constraintCompilerTool;
        this.jsonPathQueryTool = jsonPathQueryTool;
        this.loggerTool = loggerTool;
    }

    /**
     * Initializes the kernel by asynchronously loading the rule manifest.
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            // Load manifest from the registry (e.g., loading mcis_v1.2.json)
            this.manifest = await this.integrityRulesManifestRegistry.getManifest();
            if (!this.manifest || !this.manifest.rulesets) {
                this.loggerTool.warn("Integrity Validation Manifest loaded but appears empty or malformed.");
            }
        } catch (error) {
            this.loggerTool.error("Failed to load integrity rules manifest during initialization.", { error });
            throw new Error("Initialization failure: Integrity manifest loading failed.");
        }
    }

    /**
     * Loads rulesets based on the operation and caches compiled versions.
     * This method operates synchronously on the pre-loaded `this.manifest`.
     * @param {string} operation
     * @returns {object | null}
     */
    loadRules(operation) {
        if (!this.manifest || !this.manifest.rulesets) {
            return null;
        }

        if (this.compiledRulesCache[operation]) {
            return this.compiledRulesCache[operation];
        }

        const rawRuleset = this.manifest.rulesets[operation];
        if (!rawRuleset) return null;

        const compiledRuleset = {
            ...rawRuleset,
            rules: rawRuleset.rules.map(rule => {
                // Delegate compilation to the injected tool
                const compiledConstraint = this.constraintCompilerTool.compile(rule.constraint);
                
                if (!compiledConstraint || typeof compiledConstraint.check !== 'function') {
                     this.loggerTool.error(`Constraint compilation failed for rule ID: ${rule.id} using constraint: ${rule.constraint}`);
                     return null;
                }

                return {
                    ...rule,
                    compiledConstraint: compiledConstraint
                };
            }).filter(Boolean)
        };

        this.compiledRulesCache[operation] = compiledRuleset;
        return compiledRuleset;
    }

    /**
     * Creates a detailed failure object for standardized reporting.
     * @param {object} rule
     * @param {string} severity
     * @param {*} value
     * @returns {object}
     */
    _createFailure(rule, severity, value) {
        // Truncate long values for reporting clarity
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
     * @returns {Promise<Array<object>>} - List of failed constraints.
     */
    async validate(payload, operation) {
        if (!this.manifest) {
            this.loggerTool.error("Attempted validation before Integrity Manifest was initialized.");
            return [];
        }

        const ruleset = this.loadRules(operation);
        if (!ruleset) return [];

        const failures = [];

        for (const rule of ruleset.rules) {
            const { target, compiledConstraint } = rule;
            
            // 1. Get all targeted values using the injected JsonPath Query Tool
            const targets = this.jsonPathQueryTool.get(payload, target);

            // Handle path not found / empty list case
            if (targets.length === 0) {
                 if (compiledConstraint.type === 'is_defined') {
                      // Failed definition check because the path resolved to nothing in the payload structure.
                      failures.push(this._createFailure(rule, ruleset.severity, undefined));
                 }
                 continue;
            }

            for (const targetValue of targets) {
                // 2. Execute pre-compiled constraint check (synchronous check function)
                if (!compiledConstraint.check(targetValue)) {
                    failures.push(this._createFailure(rule, ruleset.severity, targetValue));
                }
            }
        }
        return failures;
    }
}

module.exports = IntegrityValidationEngineKernel;