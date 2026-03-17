/**
 * Protocol Specification Validator (Sovereign AGI v94.1)
 * Ensures CHR generation specs comply with architectural standards and constraints.
 */
class SpecValidator {
    /**
     * @param {Object} schemaRegistry - Service providing schema access (e.g., AJV instance wrapper).
     * @param {Object} versionResolver - Utility for checking component version compatibility.
     */
    constructor(schemaRegistry, versionResolver) {
        if (!schemaRegistry || !versionResolver) {
            throw new Error("SpecValidator requires both a schemaRegistry and a versionResolver.");
        }
        this.schemas = schemaRegistry;
        this.versionResolver = versionResolver;

        // Standardized structure for custom validation rules execution
        this._customValidationRules = [
            {
                name: 'CONSTRAINT_COHERENCE',
                validator: this._checkConstraintCoherence.bind(this)
            },
            {
                name: 'DEPENDENCY_RESOLUTION',
                validator: this._checkDependencyResolution.bind(this)
            }
        ];
    }

    /**
     * Executes all registered custom validation rules against the spec.
     * @param {Object} spec The specification object.
     * @param {Array<Object>} errors The collected errors array (mutable).
     * @private
     */
    _runCustomValidations(spec, errors) {
        for (const rule of this._customValidationRules) {
            try {
                // Custom validators collect errors directly into the 'errors' array
                rule.validator(spec, errors);
            } catch (e) {
                 // Handles unexpected runtime errors within a specific custom validation rule
                 errors.push({
                    type: `RULE_EXECUTION_FAILURE:${rule.name}`,
                    code: 'INTERNAL',
                    message: `Custom rule execution failed unexpectedly.`,
                    details: e.message
                });
            }
        }
    }


    /**
     * Validates a generation specification object, collecting all errors.
     * @param {Object} spec The specification object conforming to protocol/chr_generation_spec.json.
     * @returns {true} True if valid.
     * @throws {Error} Consolidated validation error detailing all failures.
     */
    validate(spec) {
        const validationErrors = [];
        const specName = 'chr_generation_spec';

        // 1. Structural Schema Validation
        const schema = this.schemas.getSchema(specName);
        
        if (!schema) {
             throw new Error(`Critical: Required schema '${specName}' is missing from the registry.`);
        }
        
        // Execute structural validation
        if (!schema.validate(spec)) {
            const schemaErrors = schema.errors || "Validation failure occurred, but schema errors object was not provided.";
            
            validationErrors.push({ 
                type: 'SCHEMA_VIOLATION', 
                code: 'STRUCTURAL',
                message: 'Specification failed to meet the baseline JSON schema.',
                details: schemaErrors
            });
        }

        // 2. Custom Business Logic and Coherence Checks
        // Only run if structural validation provides a reliable base object
        if (validationErrors.length === 0) {
            this._runCustomValidations(spec, validationErrors);
        }

        // 3. Consolidated Failure Handling
        if (validationErrors.length > 0) {
            const errorSummary = validationErrors.map(err => {
                // Enhance error presentation for complex details
                const detailsStr = typeof err.details === 'string' ? err.details : JSON.stringify(err.details, null, 2);
                return `[${err.type}] (${err.code || 'N/A'}): ${err.message}\n${detailsStr}`;
            }).join('\n---\n');
            
            throw new Error(`CHR Spec Validation Failed (${validationErrors.length} errors):\n---\n${errorSummary}`);
        }

        return true;
    }

    /** 
     * Ensures logic limits (e.g., hard > soft) are obeyed. 
     * @private
     */
    _checkConstraintCoherence(spec, errors) {
        // Use optional chaining for safe access (assuming modern JS environment)
        const memLimits = spec?.generation_parameters?.runtime_constraints?.memory_footprint_mb;

        if (memLimits) {
            const hard = memLimits.hard_limit;
            const soft = memLimits.soft_limit;

            if (hard < soft) {
                errors.push({
                    type: 'CONSTRAINT_COHERENCE',
                    code: 'LIMIT_INVERSION',
                    message: "Hard memory limit cannot be less than soft limit.",
                    details: `Hard: ${hard} MB, Soft: ${soft} MB`
                });
            }
        } 
    }

    /** 
     * Ensures all required component versions are compatible with the protocol runtime. 
     * @private
     */
    _checkDependencyResolution(spec, errors) {
        const dependencies = spec?.component_dependencies || {};

        for (const [component, details] of Object.entries(dependencies)) {
            if (details?.required && details?.version_lock) {
                if (!this.versionResolver.isCompatible(component, details.version_lock)) {
                    errors.push({
                        type: 'DEPENDENCY_CONFLICT',
                        code: 'VERSION_INCOMPATIBILITY',
                        message: `Required dependency version lock failed against current protocol runtime.`,
                        details: `Component: ${component}, Lock: ${details.version_lock}`
                    });
                }
            }
        }
    }
}

module.exports = SpecValidator;