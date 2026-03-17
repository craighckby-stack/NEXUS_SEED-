/**
 * utils/ObjectUtils.js
 * Scope: Core system utilities providing advanced object manipulation critical for governance and data integrity.
 * Mandate: Provide Canonical JSON serialization and Deep Freezing capabilities.
 */

// NOTE: The recursiveSortKeys logic has been extracted into the CanonicalSerializationUtility plugin.

/**
 * Recursively freezes an object and all nested objects.
 * @param {Object} obj
 * @returns {Object}
 */
const internalDeepFreeze = (obj) => {
    // Must be an object that is not null
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Retrieve the property names defined on obj
    const propNames = Object.getOwnPropertyNames(obj);
  
    // Recursively freeze properties before freezing self
    propNames.forEach((name) => {
        const prop = obj[name];
        if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
            internalDeepFreeze(prop);
        }
    });
  
    // Freeze self (shallow freeze)
    return Object.freeze(obj);
};


class ObjectUtils {
    /**
     * Ensures deterministic serialization of data by recursively sorting all object keys.
     * This produces Canonical JSON string output necessary for consistent content hashing.
     * Now delegates to the CanonicalSerializationUtility plugin.
     * @param {Object} data 
     * @returns {string} Canonical JSON string.
     */
    canonicalStringify(data) {
        // CRITICAL: Delegate to the dedicated plugin.
        // Assuming CanonicalSerializationUtility is accessible in the runtime environment.
        if (typeof CanonicalSerializationUtility === 'undefined' || typeof CanonicalSerializationUtility.execute !== 'function') {
             throw new Error("Required plugin 'CanonicalSerializationUtility' is unavailable or improperly initialized.");
        }
        return CanonicalSerializationUtility.execute({ data: data });
    }

    /**
     * Recursively freezes an object and all nested objects (down to the deepest level) 
     * to enforce full, structural immutability, essential for Policy (P-01) fidelity.
     * @param {Object} obj
     * @returns {Object} Deep frozen object.
     */
    deepFreeze(obj) {
        return internalDeepFreeze(obj);
    }
}

module.exports = ObjectUtils;