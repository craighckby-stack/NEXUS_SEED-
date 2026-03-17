/**
 * Utility function to recursively merge properties from source into target (deep merge).
 * Handles nested objects without merging arrays.
 * @param {object} target - The object to merge into.
 * @param {object} source - The object providing new values.
 * @returns {object} The merged target object.
 */
const deepMerge = (target, source) => {
    for (const key of Object.keys(source)) {
        // Check for deep structure merge
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            // Standard overwrite
            target[key] = source[key];
        }
    }
    return target;
};

// UNIFIER Protocol: Export for central integration
module.exports = { deepMerge };