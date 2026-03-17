class IntegrityScannerKernel {
    #secureLoader;
    #exclusionChecker;
    #logger;

    /**
     * @param {object} dependencies
     * @param {SecureResourceLoaderInterfaceKernel} dependencies.SecureResourceLoaderInterfaceKernel
     * @param {IPathExclusionCheckerToolKernel} dependencies.IPathExclusionCheckerToolKernel
     * @param {ILoggerToolKernel} dependencies.ILoggerToolKernel
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    #setupDependencies(dependencies) {
        const {
            SecureResourceLoaderInterfaceKernel,
            IPathExclusionCheckerToolKernel,
            ILoggerToolKernel,
        } = dependencies;

        if (!SecureResourceLoaderInterfaceKernel || !IPathExclusionCheckerToolKernel || !ILoggerToolKernel) {
            throw new Error("IntegrityScannerKernel requires SecureResourceLoaderInterfaceKernel, IPathExclusionCheckerToolKernel, and ILoggerToolKernel.");
        }

        this.#secureLoader = SecureResourceLoaderInterfaceKernel;
        this.#exclusionChecker = IPathExclusionCheckerToolKernel;
        this.#logger = ILoggerToolKernel;
    }

    async initialize() {
        // Kernel initialization logic (if required)
    }

    /**
     * Internal helper to join path segments, replacing reliance on the native 'path' module.
     * Assumes standard forward slash separation for cross-platform compatibility within the engine.
     */
    #joinPath(part1, part2) {
        if (!part1) return part2;
        if (!part2) return part1;
        const separator = '/';
        
        // Normalize segments for robust joining
        let p1 = part1.endsWith(separator) ? part1.slice(0, -1) : part1;
        let p2 = part2.startsWith(separator) ? part2.slice(1) : part2;
        
        // Handle root relative path case where part1 is empty string
        if (part1 === '' && part2 !== '') {
            return part2;
        }

        return `${p1}${separator}${p2}`;
    }

    /**
     * Recursively scans a directory and returns a list of paths for files
     * that should be included in the manifest.
     * Paths returned are relative to the provided rootDir.
     * 
     * @param {string} rootDir The starting directory for the scan (assumed to be resolved externally).
     * @param {string[]} [ignorePatterns=[]] Optional array of partial path strings to skip.
     * @returns {Promise<string[]>} List of file paths, relative to rootDir.
     */
    async scanDirectory(rootDir, ignorePatterns = []) {
        const filesToHash = [];
        const self = this;

        async function traverse(currentDir, relativePath) {
            try {
                // Use the injected Secure Resource Loader for I/O operations
                const entries = await self.#secureLoader.readDirAsync(currentDir, { withFileTypes: true });

                for (const entry of entries) {
                    // Use internal helper for path joining
                    const entryPathAbs = self.#joinPath(currentDir, entry.name);
                    const entryRelativePathClean = self.#joinPath(relativePath, entry.name);

                    // Use the injected exclusion checker tool
                    if (self.#exclusionChecker.check(entryRelativePathClean, ignorePatterns)) {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        // Skip symbolic links
                        if (!entry.isSymbolicLink()) {
                            await traverse(entryPathAbs, entryRelativePathClean);
                        }
                    } else if (entry.isFile()) {
                        filesToHash.push(entryRelativePathClean);
                    }
                }
            } catch (e) {
                // Use the injected logger tool instead of console.warn
                self.#logger.warn(`Integrity Scanner Warning: Could not read directory ${currentDir}`, { error: e.message, code: 'SCAN_READ_FAIL' });
            }
        }

        await traverse(rootDir, '');
        return filesToHash;
    }
}

module.exports = IntegrityScannerKernel;