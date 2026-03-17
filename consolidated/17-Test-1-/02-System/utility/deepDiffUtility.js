/**
 * Utility for calculating the differential (Delta Psi) between two state objects
 * adhering to the JSON Patch specification (RFC 6902).
 */

/**
 * Helper to structure a JSON Patch operation dictionary.
 * Includes 'from' (old_value) for state rollback auditability, even if optional in RFC 6902.
 * @param {string} op - The operation ('add', 'remove', 'replace', 'move', 'copy', 'test').
 * @param {string} path - The JSON Pointer path.
 * @param {any} [value] - The new value (for add/replace/test).
 * @param {any} [old_value] - The old value (for audit/rollback).
 * @returns {object} The JSON Patch operation object.
 */
function _getOpDetails(op, path, value, old_value) {
    /** @type {Object} */
    const details = { op: op, path: path };

    // Required 'value' fields for specific operations (RFC 6902)
    if (["add", "replace", "test"].includes(op) && typeof value !== 'undefined') {
        details.value = value;
    }

    // Optional audit/rollback 'from' field
    if (typeof old_value !== 'undefined' && ["replace", "remove"].includes(op)) {
        details.from = old_value;
    }

    return details;
}

/**
 * Recursive function for calculating differences.
 * @param {any} oldState - The previous state node.
 * @param {any} newState - The current state node.
 * @param {string} path - The current JSON Pointer path.
 * @param {Array<Object>} diffs - Accumulator for JSON Patch operations.
 */
function _deepCompare(oldState, newState, path, diffs) {
    // 1. Base case: Identity comparison
    if (oldState === newState) {
        return;
    }

    // Determine effective types for comparison, handling null/array special cases.
    const getEffectiveType = (val) => {
        if (Array.isArray(val)) return 'array';
        if (val === null) return 'null';
        return typeof val;
    };

    const typeOld = getEffectiveType(oldState);
    const typeNew = getEffectiveType(newState);

    // Handle type change (always a replacement)
    if (typeOld !== typeNew) {
        diffs.push(_getOpDetails("replace", path, newState, oldState));
        return;
    }
    
    // 2. Recurse into Dictionaries (Objects)
    if (typeOld === 'object') {
        const oldKeys = new Set(Object.keys(oldState));
        const newKeys = new Set(Object.keys(newState));

        // Removals
        for (const key of oldKeys) {
            if (!newKeys.has(key)) {
                const currentPath = `${path}/${key}`;
                diffs.push(_getOpDetails("remove", currentPath, undefined, oldState[key]));
            }
        }

        // Additions and Modifications
        for (const key of newKeys) {
            const currentPath = `${path}/${key}`;
            if (!oldKeys.has(key)) {
                diffs.push(_getOpDetails("add", currentPath, newState[key]));
            } else {
                _deepCompare(oldState[key], newState[key], currentPath, diffs);
            }
        }
        return;
    }

    // 3. Recurse into Lists (Arrays)
    if (typeOld === 'array') {
        const lenOld = oldState.length;
        const lenNew = newState.length;

        // Iterate over the minimum length for modifications/replaces
        const minLen = Math.min(lenOld, lenNew);
        for (let i = 0; i < minLen; i++) {
            const currentPath = `${path}/${i}`;
            _deepCompare(oldState[i], newState[i], currentPath, diffs);
        }

        // Additions
        if (lenNew > lenOld) {
            for (let i = lenOld; i < lenNew; i++) {
                const currentPath = `${path}/${i}`;
                diffs.push(_getOpDetails("add", currentPath, newState[i]));
            }
        } 
        
        // Removals (Iterate backward to prevent index shift)
        else if (lenOld > lenNew) {
            for (let i = lenOld - 1; i >= lenNew; i--) {
                const currentPath = `${path}/${i}`;
                diffs.push(_getOpDetails("remove", currentPath, undefined, oldState[i]));
            }
        }

        return;
    }

    // 4. Handle Scalar/Atomic types (Must be different if execution reaches here)
    diffs.push(_getOpDetails("replace", path, newState, oldState));
}

/**
 * Calculates a deep difference between two state objects (JSON Patch compliant).
 * @param {object | Array<any>} oldState - The original state.
 * @param {object | Array<any>} newState - The target state.
 * @returns {Array<Object>} A list of JSON Patch operations (RFC 6902).
 */
function calculateDeepDiff(oldState, newState) {
    if (oldState === newState) {
        return [];
    }
    
    // Handle cases where roots are scalars or types are fundamentally mismatched at root level
    if (typeof oldState !== 'object' || oldState === null || typeof newState !== 'object' || newState === null) {
        return [_getOpDetails("replace", "", newState, oldState)];
    }

    const differential = [];
    // Start comparison from the root path "".
    _deepCompare(oldState, newState, "", differential);
    return differential;
}

module.exports = {
    calculateDeepDiff
};