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
const deepFreeze = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null || Object.isFrozen(obj)) return obj;
    Object.keys(obj).forEach(key => deepFreeze(obj[key]));
    return Object.freeze(obj);
};

// --- UTILITY 2: External Primitive Type Coercion Hook ---

// Assume EnvironmentTypeCoercer plugin execution function is available/imported.
interface EnvironmentCoercerPlugin {
    execute: (args: { value: any, type: string, defaultValue: any }) => any;
}
declare const EnvironmentTypeCoercer: EnvironmentCoercerPlugin;

// --- UTILITY 3: Safe JSON Coercion and Deep Immutability ---

/**
 * Handles ENV string parsing for complex JSON objects and enforces deep immutability.
 */
const safeJsonCoercer = (envString: string | undefined, defaultValue: any): any => {
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
 */
interface ConfigSchemaItem {
    env: string;
    type: 'int' | 'float' | 'bool' | 'string' | 'object';
    default: any;
}

const loadConfigFromSchema = (
    schema: Record<string, ConfigSchemaItem>,
    envSource: Record<string, string | undefined>
): Record<string, any> => {
    const settings: Record<string, any> = {};

    for (const key in schema) {
        if (!Object.prototype.hasOwnProperty.call(schema, key)) continue;

        const item = schema[key];
        const envValue = envSource[item.env];

        if (item.type === 'object') {
            settings[key] = safeJsonCoercer(envValue, item.default);
        } else {
            // Use the external EnvironmentTypeCoercer plugin
            settings[key] = EnvironmentTypeCoercer.execute({
                value: envValue,
                type: item.type,
                defaultValue: item.default
            });
        }
    }

    // Ensure the top-level map of settings is shallow frozen.
    return Object.freeze(settings);
};

// Use modern export syntax compatible with TypeScript structure
export {
    loadConfigFromSchema,
    deepFreeze,
};
