/**
 * Configuration Validator Utility (Sovereign AGI v94.1)
 * Ensures that governance configuration settings adhere to defined structural integrity 
 * and operational constraints (e.g., value ranges, types). Essential for applying configuration
 * loaded from untrusted or external dynamic sources.
 *
 * Refactor Logic: Validation logic delegated to ConfigurationConstraintValidator plugin.
 */

// Assuming ConfigurationConstraintValidator is available globally or via module loader
declare const ConfigurationConstraintValidator: {
    execute: (args: { config: Record<string, any>, constraints: Record<string, any> }) => string[]
};

const CONFIG_CONSTRAINTS = {
    GHM_SMOOTHING_ALPHA: { type: 'number', min: 0.0, max: 1.0, required: true, description: "Alpha smoothing factor for metrics aggregation." },
    GHM_MINIMUM_READINESS_THRESHOLD: { type: 'number', min: 0.0, max: 1.0, required: true, description: "Minimum readiness score before mission deployment." },
    GHM_LATENCY_THRESHOLD_MS: { type: 'number', min: 50, required: true, description: "Maximum allowable operational latency in milliseconds." },
    GHM_MAX_VIOLATIONS_TOLERANCE: { type: 'number', min: 1, max: 100, required: true, description: "Maximum number of allowed integrity violations before rollback." }
    // Note: Complex structural validation should utilize dedicated schema checking utilities (e.g., schemaGuard).
};

const DEPENDENCY_FAILURE_MSG = "Critical AGI dependency missing: ConfigurationConstraintValidator plugin is required for config validation.";

/**
 * Validates the provided configuration object against predefined constraints.
 * Throws a comprehensive error if any constraint is violated.
 * @param {object} config - The merged configuration object to validate.
 * @throws {Error} if validation fails.
 */
function validateConfig(config: Record<string, any>): boolean {
    if (typeof ConfigurationConstraintValidator === 'undefined' || typeof ConfigurationConstraintValidator.execute !== 'function') {
        throw new Error(DEPENDENCY_FAILURE_MSG);
    }
    
    const errors = ConfigurationConstraintValidator.execute({
        config: config,
        constraints: CONFIG_CONSTRAINTS
    });

    if (errors.length > 0) {
        throw new Error(`⚠️ Invalid Governance Configuration Detected (Total Errors: ${errors.length}):\n  > ${errors.join('\n  > ')}`);
    }

    return true;
}

module.exports = {
    validateConfig,
    CONFIG_CONSTRAINTS
};
