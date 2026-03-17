/**
 * Scope Matcher Utility
 * Provides high-performance, robust glob pattern matching for system path constraints
 * by delegating to the cached AGI-KERNEL GlobPathMatcherUtility plugin.
 */

// Global accessor for the plugin (simulated environment access)
declare const AGI_PLUGIN: {
    GlobPathMatcherUtility: {
        isMatch(args: { filePath: string, scopePattern: string }): boolean;
    };
};

export class ScopeMatcher {
    // The constructor is now minimal as caching and compilation are delegated to the plugin.
    constructor() {
        // Delegated initialization.
    }

    /**
     * Checks if a given file path matches the specified glob scope pattern.
     * Delegates the logic to the optimized GlobPathMatcherUtility.
     * 
     * @param {string} filePath - The path to check.
     * @param {string} scopePattern - The glob pattern (e.g., 'system/**/*.js').
     * @returns {boolean}
     */
    isMatch(filePath: string, scopePattern: string): boolean {
        if (!filePath || !scopePattern) {
            return false;
        }

        try {
            return AGI_PLUGIN.GlobPathMatcherUtility.isMatch({
                filePath,
                scopePattern
            });
        } catch (e) {
            // Log failure to execute plugin logic
            console.error("ScopeMatcher plugin execution failed:", e);
            return false;
        }
    }
}