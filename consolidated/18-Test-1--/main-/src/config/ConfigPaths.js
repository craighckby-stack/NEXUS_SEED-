/**
 * SystemPathResolverKernel
 * Encapsulates system path resolution logic, replacing static path constants.
 * Enforces Dependency Injection for path utilities and isolates environment context determination.
 */
class SystemPathResolverKernel {
    #pathUtility;
    #appRoot;

    /**
     * @param {object} pathUtility - The Node.js 'path' module or equivalent utility exposing a 'resolve' function.
     * @param {string} [appRoot] - Optional root directory override. If null, process.cwd() is used via I/O proxy.
     */
    constructor(pathUtility, appRoot = null) {
        this.#pathUtility = pathUtility;
        this.#appRoot = appRoot; 
        
        this.#setupDependencies();
    }
    
    #setupDependencies() {
        if (!this.#pathUtility || typeof this.#pathUtility.resolve !== 'function') {
            throw new Error('SystemPathResolverKernel requires a valid path utility exposing a resolve method.');
        }
        
        // Determine the application root context if not explicitly injected.
        if (!this.#appRoot) {
            this.#appRoot = this.#delegateToEnvironmentGetCwd();
        }
    }
    
    // I/O Proxy: Encapsulates interaction with the environment (getting CWD).
    // This is an environment-specific I/O operation and must be isolated.
    #delegateToEnvironmentGetCwd() {
        // Note: Assumes execution environment provides process.cwd()
        if (typeof process === 'undefined' || typeof process.cwd !== 'function') {
            throw new Error('Cannot determine application root: process.cwd() is unavailable.');
        }
        return process.cwd();
    }

    // I/O Proxy: Resolves paths relative to the stored application root.
    #delegateToPathResolve(relativePath) {
        return this.#pathUtility.resolve(this.#appRoot, relativePath);
    }
    
    /**
     * Resolves the absolute path for the critical Governance Thresholds configuration.
     * @returns {string}
     */
    getGovernanceConfigPath() {
        return this.#delegateToPathResolve('config/governance.yaml');
    }

    /**
     * Resolves the absolute path for the standard logger output directory.
     * @returns {string}
     */
    getLogDirectoryPath() {
        return this.#delegateToPathResolve('logs');
    }

    /**
     * Resolves the absolute path for temporary artifact storage.
     * @returns {string}
     */
    getArtifactTempDirectoryPath() {
        return this.#delegateToPathResolve('tmp/artifacts');
    }
}

export default SystemPathResolverKernel;