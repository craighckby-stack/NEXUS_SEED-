/**
 * Generic Configuration Utility Library (Sovereign AGI v94.1)
 * Provides robust functions for coercing environment variables (ENV) and ensuring deep immutability.
 */

// --- UTILITY 1: Deep Freezing ---

/**
 * Recursively freezes an object to ensure deep immutability.
 * @param {object} obj - The object to freeze.
 * @returns {object} The frozen object.
 */
const deepFreeze = (obj) => {
    if (typeof obj !== 'object' || obj === null || Object.isFrozen(obj)) return obj;
    Object.keys(obj).forEach(key => deepFreeze(obj[key]));
    return Object.freeze(obj);
};

// --- UTILITY 2: Primitive Type Coercion ---

/**
 * Safely coerces a string value to the required primitive type (int, float, bool, string).
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
            const lowerVal = val.toLowerCase();
            if (['true', '1', 't', 'y', 'yes'].includes(lowerVal)) {
                return true;
            }
            if (['false', '0', 'f', 'n', 'no'].includes(lowerVal)) {
                return false;
            }
            return defaultValue;
        default:
            return val; // String
    }
};

// --- UTILITY 3: Safe JSON Coercion and Deep Immutability ---

/**
 * Handles ENV string parsing for complex JSON objects and enforces deep immutability.
 */
const safeJsonCoercer = (envString, defaultValue) => {
    let coercedValue = defaultValue;

    if (envString) {
        try {
            const parsed = JSON.parse(String(envString).trim());
            // Ensure result is a structured type (object, excluding null and arrays for this specific config style)
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) { 
                coercedValue = parsed;
            }
        } catch (e) {
            // Failed to parse: relies on consumer config file to log specific context
        }
    }

    // Use deep copy (JSON serialization is sufficient for config data structures) before freezing
    const finalObject = JSON.parse(JSON.stringify(coercedValue)); 
    return deepFreeze(finalObject);
};


/**
 * Core function to load configuration based on a schema and an environment source.
 * @param {object} schema - The configuration schema (defines default, env key, and type).
 * @param {object} envSource - The object providing environment variables (usually process.env).
 * @returns {object} The finalized, deep-immutable configuration object.
 */
const loadConfigFromSchema = (schema, envSource) => {
    const settings = {};

    for (const key in schema) {
        if (!schema.hasOwnProperty(key)) continue;

        const item = schema[key];
        const envValue = envSource[item.env];

        if (item.type === 'object') {
            settings[key] = safeJsonCoercer(envValue, item.default);
        } else {
            settings[key] = coercePrimitiveValue(envValue, item.type, item.default);
        }
    }

    // Ensure the top-level map of settings is shallow frozen.
    return Object.freeze(settings);
};

module.exports = {
    loadConfigFromSchema,
    deepFreeze, 
};