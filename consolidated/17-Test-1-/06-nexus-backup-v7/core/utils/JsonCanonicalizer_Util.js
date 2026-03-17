/**
 * AGI-KERNEL v7.11.3 - JsonCanonicalizer Utility
 * Purpose: Ensures a consistent, deterministic string representation of state objects
 * by delegating canonicalization and hashing to the CanonicalStateIntegrityTool plugin.
 */

const CanonicalStateIntegrityTool = require('@agi-kernel/plugins/CanonicalStateIntegrityTool');

/**
 * Utility wrapper exposing core canonicalization and hashing functions 
 * from the underlying integrity tool.
 * 
 * This utility acts as a direct architectural proxy to the CanonicalStateIntegrityTool,
 * minimizing indirection for core state integrity operations.
 * 
 * @module JsonCanonicalizer_Util
 */
class JsonCanonicalizerUtility {

    /**
     * Creates a canonical string representation of a JavaScript object (strict key order, no spacing).
     * @param {*} data - The value to canonicalize (usually an object).
     * @returns {string} The canonical JSON string.
     */
    static canonicalize(data) {
        // Direct delegation to the underlying integrity tool, removing unnecessary indirection layers.
        return CanonicalStateIntegrityTool.canonicalize(data);
    }
    
    /**
     * Generates a cryptographic hash (SHA-256) of the canonical string representation.
     * @param {*} data - The data or pre-canonicalized string.
     * @returns {string} The resulting SHA-256 hash (hex).
     */
    static hash(data) {
        // Direct delegation to the underlying integrity tool, removing unnecessary indirection layers.
        return CanonicalStateIntegrityTool.hash(data);
    }
}

module.exports = JsonCanonicalizerUtility;