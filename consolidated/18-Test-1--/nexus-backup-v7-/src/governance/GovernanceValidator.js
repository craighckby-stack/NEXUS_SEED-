/**
 * Governance Settings Schema Validator (v94.1, Refactored)
 * Enforces strict bounds, integrity checks, and type constraints on GHM configuration settings.
 */

// NOTE: This module is designed to interact optimally with a dedicated ConfigurationError class
// (scaffolded below) for structured error reporting.

/**
 * Defines core constraint checks for required types.
 */
const TypeCheckers = {
    /** Checks if a value is a strict integer. */
    int: (v) => typeof v === 'number' && Number.isInteger(v),
    /** Checks if a value is a standard JavaScript number (float or int). */
    float: (v) => typeof v === 'number' && isFinite(v),
    /** Checks if a value is a strict boolean. */
    boolean: (v) => typeof v === 'boolean',
    /** Checks if a value is a non-empty string. */
    string: (v) => typeof v === 'string' && v.trim().length > 0,
};

/**
 * Defines critical constraints and expected types for governance parameters.
 */
const GHM_GOVERNANCE_SCHEMA = {
    GHM_LATENCY_THRESHOLD_MS: { min: 100, max: 5000, type: 'int', description: 'Latency must be fast but not unrealistically low.' },
    GHM_SMOOTHING_ALPHA: { min: 0.05, max: 0.5, type: 'float', description: 'Alpha must be within a stable range to avoid oscillations.' },
    GHM_MINIMUM_READINESS_THRESHOLD: { min: 0.75, max: 1.0, type: 'float', description: 'Readiness must be above 0.75 to activate core protocols.' },
    GHM_MAX_VIOLATIONS_TOLERANCE: { min: 1, max: 10, type: 'int', description: 'Tolerance for minor policy violations.' }
};

/**
 * Executes bounds checking against numeric constraints (min/max).
 * @param {*} value
 * @param {object} constraint
 * @returns {string | null} Violation details or null if valid.
 */
function _checkBounds(value, constraint) {
    if (typeof value !== 'number') return null; 
    
    if (constraint.min !== undefined && value < constraint.min) {
        return `BELOW_MIN: Value (${value}) is below minimum acceptable threshold (${constraint.min}).`;
    }
    if (constraint.max !== undefined && value > constraint.max) {
        return `EXCEEDS_MAX: Value (${value}) exceeds maximum acceptable threshold (${constraint.max}).`;
    }
    return null;
}

/**
 * Validates a loaded configuration object against defined constraints.
 * @param {object} settings - The finalized GOVERNANCE_SETTINGS object.
 * @param {object} [schema=GHM_GOVERNANCE_SCHEMA] - Optional custom schema.
 * @returns {boolean} True if validation passes.
 * @throws {Error} If any setting violates its constraints (critical failure).
 */
function validateGovernanceSettings(settings, schema = GHM_GOVERNANCE_SCHEMA) {
    const failureReports = [];
    
    // Use Object.entries for cleaner, more modern iteration.
    for (const [key, constraint] of Object.entries(schema)) {
        const value = settings[key];

        // 1. Existence Check (Required Settings)
        if (value === undefined || value === null) {
             failureReports.push({ key, reason: 'MISSING_REQUIRED', message: `Setting is required but missing or null.` });
             continue;
        }

        // 2. Type Check
        const typeChecker = TypeCheckers[constraint.type];
        if (typeChecker && !typeChecker(value)) {
            failureReports.push({ 
                key, 
                reason: 'TYPE_MISMATCH', 
                message: `Expected type '${constraint.type}', received value '${String(value)}' (Type: ${typeof value}).` 
            });
        }

        // 3. Bounds Check (If applicable and numeric)
        const boundsViolation = _checkBounds(value, constraint);
        if (boundsViolation) {
            const [reason, message] = boundsViolation.split(': ', 2); 
            failureReports.push({ key, reason, message });
        }
    }

    if (failureReports.length > 0) {
        const detailedFailures = failureReports.map(
            (f, i) => `[${i + 1}] ${f.key} (${f.reason}): ${f.message}`
        ).join('\n');
        
        const errorMsg = `GHM Configuration Integrity Failure (${failureReports.length} violations found):\n${detailedFailures}`;
        
        console.error(errorMsg);
        
        // Throwing a standard Error object but attaching structured violation data for robust systems.
        const err = new Error(errorMsg);
        err.name = 'ConfigurationIntegrityError';
        err.violations = failureReports; // Crucial for programmatic error handling
        throw err;
    }

    console.debug('[GHM Integrity v94.1] Governance settings validated successfully (Type & Bounds enforced).');
    return true;
}

module.exports = {
    validateGovernanceSettings,
    GHM_GOVERNANCE_SCHEMA,
    TypeCheckers
};
