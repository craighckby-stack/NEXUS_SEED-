// system/governance/constraint_pattern_registry.js

/**
 * Constraint Pattern Registry Wrapper
 * Version 1.0 - Sovereign AGI v94.1
 * Accesses the underlying ConstraintPatternRegistryUtility kernel tool for managing 
 * complex structural constraint patterns.
 */

// CRITICAL: We rely on the core kernel environment to inject the ConstraintPatternRegistryUtility tool.
// @ts-ignore: Assume injection of utility tool
const ConstraintPatternRegistryUtility = globalThis.AGI_PLUGINS?.ConstraintPatternRegistryUtility;

export class ConstraintPatternRegistry {
    constructor() {
        if (typeof ConstraintPatternRegistryUtility?.getPattern !== 'function') {
            // In a real kernel environment, this error indicates a missing dependency injection.
            console.error("FATAL: ConstraintPatternRegistryUtility kernel tool is unavailable.");
        }
    }

    /**
     * Retrieves a pattern definition by its unique ID.
     * @param {string} patternId 
     * @returns {Object|null}
     */
    getPattern(patternId) {
        if (!ConstraintPatternRegistryUtility) return null;
        // The utility requires an argument object for standard invocation
        return ConstraintPatternRegistryUtility.getPattern({ patternId });
    }

    /**
     * Registers a new pattern definition at runtime.
     * @param {string} patternId
     * @param {Object} definition
     */
    registerPattern(patternId, definition) {
        if (!ConstraintPatternRegistryUtility) return false;
        // The utility handles validation and registration
        return ConstraintPatternRegistryUtility.registerPattern({ patternId, definition });
    }
}

/**
 * Export the primary singleton instance accessing the underlying utility.
 */
export const PatternRegistry = new ConstraintPatternRegistry();
