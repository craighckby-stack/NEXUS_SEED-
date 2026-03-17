/**
 * AGI-KERNEL PathRegistryKernel
 * Encapsulates immutable canonical path configuration, replacing the static 'src/config/paths.js'.
 * Ensures Dependency Injection for path resolution and environment access (process.cwd()).
 */

class PathRegistryKernel {
    /** @type {object} */
    #paths;
    /** @type {ICanonicalPathResolverToolKernel} */
    #pathResolver;
    /** @type {IEnvironmentAccessKernel} */
    #environmentAccess;
    /** @type {IDeepFreezeUtility} */
    #deepFreezeUtility;

    /**
     * @param {object} dependencies 
     * @param {ICanonicalPathResolverToolKernel} dependencies.pathResolver - Utility replacing CanonicalPathConfigurationUtility.
     * @param {IEnvironmentAccessKernel} dependencies.environmentAccess - Handles process.cwd() access.
     * @param {IDeepFreezeUtility} dependencies.deepFreezeUtility - Utility for ensuring immutability.
     */
    constructor({ pathResolver, environmentAccess, deepFreezeUtility }) {
        if (!pathResolver || !environmentAccess || !deepFreezeUtility) {
            throw new Error("PathRegistryKernel requires pathResolver, environmentAccess, and deepFreezeUtility.");
        }
        this.#pathResolver = pathResolver;
        this.#environmentAccess = environmentAccess;
        this.#deepFreezeUtility = deepFreezeUtility;
        
        this.#setupDependencies();
    }

    /**
     * Synchronous setup and constant definition.
     * Extracts synchronous dependency resolution and constant definition.
     */
    #setupDependencies() {
        const rootPath = this.#delegateToEnvironmentAccessCWD();
        
        // Delegate path resolution to the injected kernel, isolating the external utility call.
        this.#paths = this.#delegateToPathResolverGetPaths({ root: rootPath });

        // Ensure the resulting configuration is immutable
        this.#deepFreezeUtility.deepFreeze(this.#paths);
    }

    /**
     * Private I/O proxy for accessing the Current Working Directory.
     * Replaces direct reliance on process.cwd().
     * @returns {string}
     */
    #delegateToEnvironmentAccessCWD() {
        return this.#environmentAccess.getCurrentWorkingDirectory(); 
    }

    /**
     * Private I/O proxy for delegating path calculation.
     * Replaces direct call to CanonicalPathConfigurationUtility.getPaths.
     * @param {{root: string}} args
     * @returns {object}
     */
    #delegateToPathResolverGetPaths(args) {
        return this.#pathResolver.getPaths(args); 
    }

    /**
     * Returns the immutable canonical path configuration.
     * @returns {{ARTIFACT_ROOT: string, STAGING_PATH: string, QUARANTINE_PATH: string}}
     */
    getCanonicalPaths() {
        return this.#paths;
    }
}

module.exports = { PathRegistryKernel };