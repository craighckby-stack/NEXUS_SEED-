const fs = require('fs/promises');
const path = require('path');

/**
 * IntegrityScanner
 * Utility responsible for traversing the filesystem and identifying files that
 * should be included in an integrity manifest, typically filtered by directory or exclusion patterns.
 */
class IntegrityScanner {

    /**
     * Recursively scans a directory and returns a list of paths for files
     * that should be included in the manifest.
     * Paths returned are relative to the provided rootDir.
     * 
     * NOTE: This basic implementation skips symbolic links in directories and offers only basic string inclusion filtering.
     * 
     * @param {string} rootDir The starting directory for the scan.
     * @param {string[]} [ignorePatterns=[]] Optional array of partial path strings (e.g., 'node_modules', '.git') to skip.
     * @returns {Promise<string[]>} List of file paths, relative to rootDir.
     */
    static async scanDirectory(rootDir, ignorePatterns = []) {
        const fullRootPath = path.resolve(rootDir);
        const filesToHash = [];

        async function traverse(currentDir, relativePath) {
            try {
                const entries = await fs.readdir(currentDir, { withFileTypes: true });

                for (const entry of entries) {
                    const entryPath = path.join(currentDir, entry.name);
                    const entryRelativePath = path.join(relativePath, entry.name);

                    // Simple path inclusion check against ignore patterns
                    if (ignorePatterns.some(pattern => entryRelativePath.includes(pattern))) {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        // Standard practice: Skip symbolic links to prevent loop risks
                        if (!entry.isSymbolicLink()) {
                            await traverse(entryPath, entryRelativePath);
                        }
                    } else if (entry.isFile()) {
                        filesToHash.push(entryRelativePath);
                    }
                }
            } catch (e) {
                // If we hit permission issues or read errors, warn and continue traversing.
                console.warn(`Integrity Scanner Warning: Could not read directory ${currentDir}: ${e.message}`);
            }
        }

        // The root relative path is initialized as empty string
        await traverse(fullRootPath, '');
        return filesToHash;
    }
}

module.exports = IntegrityScanner;
