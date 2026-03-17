/**
 * Configuration Validator Utility (SOVEREIGN v94.2 | UNIFIER Protocol)
 * Ensures that governance configuration settings adhere to defined structural integrity 
 * and operational constraints. Essential for applying configuration loaded from dynamic sources.
 *
 * GOVERNANCE: Standard Laws.
 */

export const CONFIG_CONSTRAINTS = {
    GHM_SMOOTHING_ALPHA: { type: 'number', min: 0.0, max: 1.0, required: true, description: "Alpha smoothing factor for metrics aggregation." },
    GHM_MINIMUM_READINESS_THRESHOLD: { type: 'number', min: 0.0, max: 1.0, required: true, description: "Minimum readiness score before mission deployment." },
    GHM_LATENCY_THRESHOLD_MS: { type: 'number', min: 50, required: true, description: "Maximum allowable operational latency in milliseconds." },
    GHM_MAX_VIOLATIONS_TOLERANCE: { type: 'number', min: 1, max: 100, required: true, description: "Maximum number of allowed integrity violations before rollback." }
};

/**
 * Internal validator utilities.
 */
const Validators = {
    /** Checks if a required value is present. Returns true if present, false otherwise. */
    validatePresence: (value, key, constraint, errors) => {
        if (constraint.required && (value === undefined || value === null)) {
            errors.push(`[${key}] Missing required setting.`);
            return false;
        }
        return true;
    },

    /** Checks if the value matches the expected type. */
    validateType: (value, key, constraint, errors) => {
        // Skip type check if the value is missing (already reported by validatePresence)
        if (value === undefined || value === null) return;
        
        // Handle NaN specifically, as typeof NaN is 'number'
        if (constraint.type === 'number' && typeof value === 'number' && isNaN(value)) {
             errors.push(`[${key}] Value cannot be NaN.`);
             return;
        }

        if (typeof value !== constraint.type) {
            errors.push(`[${key}] Expected type ${constraint.type}, got ${typeof value}.`);
        }
    },

    /** Checks if the numeric value falls within min/max bounds. */
    validateRange: (value, key, constraint, errors) => {
        if (typeof value !== 'number') return; // Only apply range checks to verified numbers

        if (constraint.min !== undefined && value < constraint.min) {
            errors.push(`[${key}] Value ${value} is below minimum constraint ${constraint.min}.`);
        }

        if (constraint.max !== undefined && value > constraint.max) {
            errors.push(`[${key}] Value ${value} is above maximum constraint ${constraint.max}.`);
        }
    }
};

/**
 * Validates the provided configuration object against predefined constraints.
 * Throws a comprehensive error if any constraint is violated.
 * @param {object} config - The merged configuration object to validate.
 * @throws {Error} if validation fails.
 */
export function validateConfig(config) {
    const errors = [];

    for (const key in CONFIG_CONSTRAINTS) {
        const constraint = CONFIG_CONSTRAINTS[key];
        const value = config[key];

        // 1. Check Presence (Mandatory step)
        const isPresent = Validators.validatePresence(value, key, constraint, errors);
        
        if (isPresent) {
            // 2. Check Type
            Validators.validateType(value, key, constraint, errors);
            
            // 3. Check Range/Bounds
            Validators.validateRange(value, key, constraint, errors);
        }
    }

    if (errors.length > 0) {
        throw new Error(`⚠️ Invalid Governance Configuration Detected (Total Errors: ${errors.length}):\n  > ${errors.join('\n  > ')}`);
    }

    return true;
}