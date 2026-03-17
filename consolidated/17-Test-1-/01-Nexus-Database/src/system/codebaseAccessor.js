/**
 * @fileoverview Central interface for all AGI filesystem and codebase interaction.
 * This abstracts away Node.js 'fs' dependencies and centralizes codebase checks,
 * allowing the core logic to remain platform-agnostic and testable (AGI-C-06).
 */
import * as fs from 'fs';

export class CodebaseAccessor {

    /**
     * Checks if a file or directory exists at the given path within the codebase scope.
     * This should eventually be connected to an in-memory representation for speed.
     * @param {string} filePath The absolute or project-relative path to check.
     * @returns {boolean} True if the file exists.
     */
    static fileExists(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return false;
        }
        try {
            // TODO: Replace direct fs access with cached codebase state lookup
            return fs.existsSync(filePath);
        } catch (error) {
            // Logging unexpected error during file check is critical
            console.error(`[CodebaseAccessor] Failed to check existence of ${filePath}:`, error);
            return false;
        }
    }

    // Future extensions should include: readFile, writeFile, updateCodebaseMap, etc.
}