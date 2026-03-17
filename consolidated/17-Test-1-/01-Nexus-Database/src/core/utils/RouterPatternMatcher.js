/**
 * Utility for robust URI pattern matching, supporting path parameters and complex globbing.
 * This moves complex route comparison logic out of the core ValidationContextResolver,
 * making the resolver lighter and paving the way for supporting RESTful parameter validation.
 */
export class RouterPatternMatcher {

    /**
     * Checks if a target path matches a given pattern.
     * Supports exact match, trailing wildcard (*), and basic named parameters (:param).
     * 
     * @param {string} targetPath - The incoming URI path (e.g., '/users/123/details').
     * @param {string} pattern - The configured pattern (e.g., '/users/:id/*').
     * @returns {boolean} True if matched.
     */
    static matches(targetPath, pattern) {
        if (targetPath === pattern) {
            return true; // Exact match
        }

        // Convert RESTful patterns and globbing into a regular expression.
        // Note: Escapes dots and replaces common syntax for path components.
        let regexPattern = pattern
            .replace(/\./g, '\.') 
            .replace(/:([a-zA-Z0-9_]+)/g, '([^/]+)') // Match named parameters
            .replace(/\/\*$/, '(/.*)?'); // Match trailing wildcard '/*'
        
        // Ensure the pattern matches the full path from start to end.
        const regex = new RegExp(`^${regexPattern}$`); 
        
        // Perform regex test
        return regex.test(targetPath);
    }
}