/**
 * @fileoverview Utility functions for creating deep immutable copies of data structures.
 * Critical for maintaining immutability across governance, memory, and state synchronization components.
 * Delegates core cloning logic to the CanonicalCloningUtility plugin for enhanced reliability and performance optimization.
 */

// Assume AGI_PLUGINS is available in the execution context (e.g., injected by the Kernel)
const CanonicalCloningUtility = typeof AGI_PLUGINS !== 'undefined' ? AGI_PLUGINS.CanonicalCloningUtility : null;

class CloneUtil {
    /**
     * Performs a high-performance deep clone of an object using the canonical system utility.
     *
     * @param {any} obj - The object to clone.
     * @returns {any} A deep, independent clone of the object.
     * @throws {Error} If cloning fails or the utility is not available.
     */
    static deepClone(obj) {
        if (!CanonicalCloningUtility || typeof CanonicalCloningUtility.deepClone !== 'function') {
            throw new Error("CloneUtil::MISSING_DEPENDENCY - CanonicalCloningUtility is not initialized.");
        }

        // Delegate the complex, optimized cloning logic to the canonical tool.
        return CanonicalCloningUtility.deepClone(obj);
    }
}

module.exports = CloneUtil;