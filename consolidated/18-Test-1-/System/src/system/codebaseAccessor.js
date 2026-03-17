import { promises as fs } from 'fs';

/**
 * Singleton service for centralized, optimized interaction with the codebase structure.
 * This service implements the AGI filesystem abstraction (AGI-C-06) and prioritizes
 * asynchronous, non-blocking operations backed by an in-memory representation for speed.
 *
 * Optimization Note: Switched to fs.promises and implemented Promise-caching to ensure
 * maximum computational efficiency and concurrency handling (avoiding 'thundering herd').
 */
export class CodebaseAccessor {

    /** 
     * @type {Map<string, Promise<boolean>>} Cache storing existence check Promises. 
     * This prevents redundant I/O operations for concurrent requests to the same path.
     */
    static _existenceCache = new Map();

    /**
     * Checks if a file or directory exists at the given path within the codebase scope.
     * Refactored for maximum efficiency using asynchronous I/O and Promise memoization.
     * 
     * @param {string} filePath The absolute or project-relative path to check.
     * @returns {Promise<boolean>} True if the file exists.
     */
    static async fileExists(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return false;
        }

        // Recursive Abstraction/Efficiency: Check the cache for an ongoing or completed check.
        // This avoids redundant system calls (I/O optimization).
        if (CodebaseAccessor._existenceCache.has(filePath)) {
            return CodebaseAccessor._existenceCache.get(filePath);
        }

        // Define the asynchronous check using fs.promises
        const checkPromise = (async () => {
            try {
                // Use fs.promises.access for efficient, non-blocking I/O
                await fs.access(filePath);
                return true;
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return false;
                }
                // Logging critical error is still necessary
                console.error(`[CodebaseAccessor] Unexpected I/O error checking ${filePath}:`, error);
                return false;
            }
        })();

        // Cache the Promise immediately to handle concurrent calls (Thundering Herd prevention)
        CodebaseAccessor._existenceCache.set(filePath, checkPromise);

        // Return the Promise result
        return checkPromise;
    }

    // Future extensions should include: readFile (async), writeFile (async), and cache invalidation hooks.
}