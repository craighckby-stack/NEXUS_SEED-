/**
 * Governance Settings Configuration Provider (v94.1 - Intelligent Refactor)
 * Manages system-wide Governance Health Monitor (GHM) parameters.
 * Enhances environment override handling, leveraging external (or stubbed) utilities for complex JSON coercion and deep immutability.
 */

// --- UTILITY 1: Primitive Type Coercion ---

/**
 * Safely coerces a string value to the required primitive type (int, float, bool, string).
 * NOTE: This utility is marked for extraction to src/utils/config/coercePrimitiveValue.js in subsequent evolution steps.
 */
const coercePrimitiveValue = (value, type, defaultValue) => {
    if (value === undefined || value === null) {
        return defaultValue;
    }

    const val = String(value).trim();
    if (val === '') {
        return defaultValue;
    }

    switch (type.toLowerCase()) {
        case 'int':
            const i = parseInt(val, 10);
            return isNaN(i) ? defaultValue : i;
        case 'float':
            const f = parseFloat(val);
            return isNaN(f) ? defaultValue : f;
        case 'bool':
            // Robust boolean checking
            if (['true', '1', 't', 'y', 'yes'].includes(val.toLowerCase())) {
                return true;
            }
            if (['false', '0', 'f', 'n', 'no'].includes(val.toLowerCase())) {
                return false;
            }
            return defaultValue;
        default:
            return val; // String
    }
};

// --- UTILITY 2: Safe JSON Coercion and Deep Immutability (Stub) ---

/**
 * STUB: Placeholder for the robust external JSON coercer utility (see scaffold).
 * It handles ENV string parsing and deep immutability enforcement for complex objects.
 */
const safeJsonCoercer = (envString, defaultValue) => {
    let coercedValue = defaultValue;

    if (envString) {
        try {
            const parsed = JSON.parse(String(envString).trim());
            if (typeof parsed === 'object' && parsed !== null) {
                coercedValue = parsed;
            }
        } catch (e) {
            console.warn(`[GHM Config] Failed to parse complex JSON setting (ENV: ${envString ? 'Provided' : 'Missing'}). Using default.`);
        }
    }

    // Defensive deep freezing and copying is essential for governance reliability
    const deepFreeze = (obj) => {
        if (typeof obj !== 'object' || obj === null || Object.isFrozen(obj)) return obj;
        Object.keys(obj).forEach(key => deepFreeze(obj[key]));
        return Object.freeze(obj);
    };

    // Use deep copy (JSON parsing is efficient for clean data structures here) before freezing
    const finalObject = JSON.parse(JSON.stringify(coercedValue)); 
    return deepFreeze(finalObject);
};


// --- Configuration Schema Metadata Definition ---

const GOVERNANCE_SCHEMA = {
    // Key: { default: Value, env: 'ENV_KEY', type: 'type' }

    GHM_LATENCY_THRESHOLD_MS: { default: 500, env: 'GHM_LATENCY_MS', type: 'int' },
    GHM_SMOOTHING_ALPHA: { default: 0.15, env: 'GHM_SMOOTHING_ALPHA', type: 'float' },
    GHM_MINIMUM_READINESS_THRESHOLD: { default: 0.85, env: 'GHM_MIN_READINESS', type: 'float' },
    GHM_MAX_VIOLATIONS_TOLERANCE: { default: 5, env: 'GHM_MAX_VIOLATIONS', type: 'int' },
    GHM_HEALTH_MONITOR_ENABLED: { default: true, env: 'GHM_MONITOR_ENABLED', type: 'bool' },
    
    GHM_COMPONENT_CRITICALITY_WEIGHTS: {
        default: {
            mcraEngine: 1.5,
            atmSystem: 1.0,
            policyEngine: 1.2
        },
        env: 'GHM_CRITICALITY_WEIGHTS_JSON',
        type: 'object'
    },
};

/**
 * Initializes and finalizes the system governance configuration.
 * Applies environment overrides based on the defined schema and enforces complete immutability.
 * @returns {object} The finalized, immutable governance configuration.
 */
function initializeGovernanceSettings() {
    const settings = {};

    for (const key in GOVERNANCE_SCHEMA) {
        const schema = GOVERNANCE_SCHEMA[key];
        const envValue = process.env[schema.env];

        if (schema.type === 'object') {
            // Use robust utility for JSON parsing and mandatory deep freezing
            settings[key] = safeJsonCoercer(envValue, schema.default);
        } else {
            // Use robust utility for primitive type conversion
            settings[key] = coercePrimitiveValue(envValue, schema.type, schema.default);
        }
    }

    // Final shallow freeze ensures top-level settings object cannot be reassigned.
    return Object.freeze(settings);
}

const GOVERNANCE_SETTINGS = initializeGovernanceSettings();

module.exports = {
    GOVERNANCE_SETTINGS,
    /** 
     * Retrieves a governance setting.
     * @param {string} key
     * @returns {*} The configuration value (immutable).
     */
    getSetting: (key) => {
        if (!GOVERNANCE_SETTINGS.hasOwnProperty(key)) {
            // Log warning if accessing an undocumented/non-existent setting
            console.warn(`GHM: Attempted to access unknown governance setting: ${key}`);
        }
        return GOVERNANCE_SETTINGS[key];
    }
};
