/**
 * @fileoverview Utility functions for creating deep immutable copies of data structures.
 * Critical for maintaining immutability across governance, memory, and state synchronization components.
 */

class CloneUtil {
    /**
     * Performs a high-performance deep clone of an object.
     * Prioritizes Structured Clone API if available for complex types and better performance,
     * falling back to JSON serialization for guaranteed compatibility with simple schemas.
     * 
     * @param {any} obj - The object to clone.
     * @returns {any} A deep, independent clone of the object.
     */
    static deepClone(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj; // Primitive types
        }
        
        // 1. Structured Clone Check (Optimal for modern JS/Node environments)
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(obj);
            } catch (e) {
                // Fallback if structuredClone fails (e.g., non-transferable data types)
                // Logging mechanism should track this failure for debugging.
                // console.warn("Structured Clone failed, falling back to JSON serialization.", e);
            }
        }

        // 2. JSON Fallback (Reliable for basic, JSON-safe data, like governance rules)
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            // If JSON serialization also fails (e.g., circular references, huge objects),
            // a recursive manual clone is required, or throwing an error.
            throw new Error(`CloneUtil::SERIALIZATION_FAILURE - Cannot reliably deep clone object.`);
        }
    }
}

module.exports = CloneUtil;