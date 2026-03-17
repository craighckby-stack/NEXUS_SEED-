/**
 * Scope Matcher Utility
 * Provides high-performance, robust glob pattern matching for system path constraints.
 * Utilizes memoization or caching for optimized repeated pattern checks.
 */

// NOTE: In a full implementation, this class would rely on a fast internal glob library (like micromatch/fast-glob).

export class ScopeMatcher {
    constructor() {
        this.patternCache = new Map();
    }

    /**
     * Checks if a given file path matches the specified glob scope pattern.
     * @param {string} filePath - The path to check.
     * @param {string} scopePattern - The glob pattern (e.g., 'system/**/*.js').
     * @returns {boolean}
     */
    isMatch(filePath, scopePattern) {
        // Basic placeholder logic until robust glob implementation is integrated/selected.
        // If the pattern is complex, compile it once and cache it.
        
        if (scopePattern === '**/*' || scopePattern === '*') {
            return true;
        }
        
        // Simple containment check for basic patterns
        if (!scopePattern.includes('*') && !scopePattern.includes('?')) {
            return filePath.includes(scopePattern);
        }

        // TODO: Implement actual glob matching using cached compiled regex/matcher.
        // For now, return true if the path contains the basic pattern structure.
        const regex = this._getCompiledRegex(scopePattern);
        return regex.test(filePath);
    }

    /**
     * Internal method to compile glob patterns to regex for efficiency (simulated).
     * @param {string} pattern 
     * @returns {RegExp}
     */
    _getCompiledRegex(pattern) {
        if (this.patternCache.has(pattern)) {
            return this.patternCache.get(pattern);
        }
        
        // In a real scenario, convert glob to regex, handling '**', '*', '?', etc.
        // Placeholder simple conversion:
        let regexString = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexString}$`);

        this.patternCache.set(pattern, regex);
        return regex;
    }
}