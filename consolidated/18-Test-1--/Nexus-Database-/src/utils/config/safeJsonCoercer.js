/**
 * Safe JSON Environment Variable Coercer Utility (v94.1)
 * Designed to securely parse complex JSON objects from environment variables.
 * Handles runtime errors gracefully by reverting to a provided default.
 *
 * @param {string} envKey - The environment variable key (e.g., 'GHM_CRITICALITY_WEIGHTS_JSON').
 * @param {object|array} defaultValue - The immutable default structure to use on failure.
 * @returns {object|array} The safely parsed configuration object or the default value.
 */
const SAFE_JSON_COERCER_LOG_PREFIX = '[Config/Coercer]';

const safeJsonCoercer = (envKey, defaultValue) => {
    const jsonString = process.env[envKey];

    // 1. Handle missing, undefined, null, or empty string variables.
    if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') {
        return defaultValue;
    }

    try {
        const parsedValue = JSON.parse(jsonString);
        
        // 2. Structural Consistency Check: Ensure the structure type matches the expected default.
        const defaultIsArray = Array.isArray(defaultValue);
        const parsedIsArray = Array.isArray(parsedValue);
        
        const typeMatch = typeof parsedValue === typeof defaultValue;
        const arrayMatch = defaultIsArray === parsedIsArray;

        if (!typeMatch || !arrayMatch) {
             const expectedType = defaultIsArray ? 'array' : typeof defaultValue;
             const receivedType = parsedIsArray ? 'array' : typeof parsedValue;

             console.warn(
                `${SAFE_JSON_COERCER_LOG_PREFIX} ENV variable ${envKey} parsed successfully but has mismatched structural type. Expected ${expectedType}, received ${receivedType}. Reverting to default.`
             );
             return defaultValue;
        }

        // Future step: Integration point for deep schema validation (see architectural proposal).

        return parsedValue;

    } catch (e) {
        // 3. Handle parsing error, including a fragment of the failed input for diagnostics.
        const inputFragment = jsonString.substring(0, 70);

        console.error(
            `${SAFE_JSON_COERCER_LOG_PREFIX} Failed to parse JSON for ENV variable ${envKey}. Error: ${e.message}. Input fragment: "${inputFragment}". Reverting to default.`
        );
        return defaultValue;
    }
};

module.exports = safeJsonCoercer;