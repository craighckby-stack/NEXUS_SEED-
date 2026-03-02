/**
 * Safe JSON Environment Variable Coercer Utility (v94.1)
 * Designed to securely parse complex JSON objects from environment variables.
 * Handles runtime errors gracefully by reverting to a provided default.
 *
 * @param {string} envKey - The environment variable key (e.g., 'GHM_CRITICALITY_WEIGHTS_JSON').
 * @param {object|array} defaultValue - The immutable default structure to use on failure.
 * @returns {object|array} The safely parsed configuration object or the default value.
 */
const safeJsonCoercer = (envKey, defaultValue) => {
    const jsonString = process.env[envKey];

    if (!jsonString) {
        return defaultValue;
    }

    try {
        const parsed = JSON.parse(jsonString);
        
        // Type consistency check: ensure the structure type matches the expected default.
        if (typeof parsed !== typeof defaultValue || Array.isArray(parsed) !== Array.isArray(defaultValue)) {
             console.warn(`[Config/Coercer] ENV variable ${envKey} parsed successfully but has mismatched structural type (expected ${typeof defaultValue}). Reverting to default.`);
             return defaultValue;
        }

        // Future step: Add deep validation against a schema here if required for strict governance.

        return parsed;

    } catch (e) {
        console.error(`[Config/Coercer] Failed to parse JSON for ENV variable ${envKey}. Error: ${e.message}. Reverting to default.`);
        return defaultValue;
    }
};

module.exports = safeJsonCoercer;