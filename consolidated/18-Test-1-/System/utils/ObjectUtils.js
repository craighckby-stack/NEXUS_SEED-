/**
 * utils/ObjectUtils.js
 * Scope: Core system utilities providing advanced object manipulation critical for governance and data integrity.
 * Mandate: Provide Canonical JSON serialization and Deep Freezing capabilities.
 */

const recursiveSortKeys = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        // Recursively sort elements within arrays if they are objects
        return obj.map(recursiveSortKeys);
    }

    // Handle plain objects: sort keys and recurse
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
        sorted[key] = recursiveSortKeys(obj[key]);
    });
    return sorted;
};

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
     * @param {Object} data 
     * @returns {string} Canonical JSON string.
     */
    canonicalStringify(data) {
        const sortedData = recursiveSortKeys(data);
        // Note: JSON.stringify handles recursive references correctly if the object is graph-like
        return JSON.stringify(sortedData);
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