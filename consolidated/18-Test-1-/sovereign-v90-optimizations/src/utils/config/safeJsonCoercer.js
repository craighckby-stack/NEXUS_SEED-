/**
 * Safe JSON Environment Variable Coercer Utility (v94.1)
 * Designed to securely parse complex JSON objects from environment variables.
 * Handles runtime errors gracefully by reverting to a provided default.
 * 
 * Now relies on the SafeConfigurationCoercer plugin for robust parsing and validation.
 *
 * @param {string} envKey - The environment variable key (e.g., 'GHM_CRITICALITY_WEIGHTS_JSON').
 * @param {object|array} defaultValue - The immutable default structure to use on failure.
 * @returns {object|array} The safely parsed configuration object or the default value.
 */

// Assumes AGI_KERNEL provides _A_SafeConfigurationCoercer for robust execution.
const CoercerTool = typeof _A_SafeConfigurationCoercer !== 'undefined' 
    ? _A_SafeConfigurationCoercer 
    : { 
        // Fallback implementation for environments where the kernel tool is not injected.
        execute: ({ envValue, defaultValue, envKey }) => { 
            if (!envValue || typeof envValue !== 'string' || envValue.trim() === '') {
                return defaultValue;
            }
            try {
                return JSON.parse(envValue);
            } catch (e) {
                if (typeof console !== 'undefined' && console.error) {
                    const inputFragment = envValue.substring(0, 70);
                    console.error(`[Config/Coercer] Failed (fallback) to parse JSON for ENV variable ${envKey}. Reverting to default. Input fragment: "${inputFragment}"`);
                }
                return defaultValue;
            }
        } 
    };

const safeJsonCoercer = (envKey, defaultValue) => {
    // CRITICAL: process.env lookup is localized here.
    const jsonString = process.env[envKey];

    return CoercerTool.execute({
        envValue: jsonString,
        defaultValue: defaultValue,
        envKey: envKey
    });
};

module.exports = safeJsonCoercer;