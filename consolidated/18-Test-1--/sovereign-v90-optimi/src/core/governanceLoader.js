/**
 * AGI-KERNEL v7.11.3 [STRATEGIC_AGENCY]
 * Refactored component: GovernanceLoader -> GovernanceLoaderKernel
 *
 * Manages the loading, caching, and retrieval of system governance configurations.
 * Implements promise memoization for computational efficiency on repeated access.
 * Relies strictly on Dependency Injection (DI) for I/O and configuration path resolution.
 */

// NOTE: Interface imports are conceptual for this output.
// import { ISecureResourceLoaderInterfaceKernel } from './ISecureResourceLoaderInterfaceKernel';
// import { IPathRegistryKernel } from './IPathRegistryKernel';

class GovernanceLoaderKernel {
    /** @type {ISecureResourceLoaderInterfaceKernel} */
    #ioLoader;
    /** @type {IPathRegistryKernel} */
    #pathRegistry;
    /** @type {string} */
    #configDirectory;
    /** @type {Map<string, Promise<Object>>} Cache storage for pending or resolved configuration loading promises. */
    #cache = new Map();

    /**
     * @param {object} dependencies
     * @param {ISecureResourceLoaderInterfaceKernel} dependencies.ioLoader
     * @param {IPathRegistryKernel} dependencies.pathRegistry
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Rigorously validates and assigns injected dependencies.
     * Satisfies the mandate for synchronous setup extraction.
     * @param {object} dependencies
     */
    #setupDependencies(dependencies) {
        const { ioLoader, pathRegistry } = dependencies;

        if (!ioLoader || typeof ioLoader.loadJson !== 'function') {
             throw new Error("GovernanceLoaderKernel requires a valid ioLoader (ISecureResourceLoaderInterfaceKernel) instance with a 'loadJson' method.");
        }
        if (!pathRegistry || typeof pathRegistry.resolvePath !== 'function') {
             throw new Error("GovernanceLoaderKernel requires a valid pathRegistry (IPathRegistryKernel) instance with a 'resolvePath' method.");
        }
        
        this.#ioLoader = ioLoader;
        this.#pathRegistry = pathRegistry;
    }

    /**
     * Initializes the kernel, asynchronously retrieving the governance configuration root path.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Strategic constant definition for the governance config root path
        const GOVERNANCE_CONFIG_DIR_KEY = 'GOVERNANCE_CONFIG_ROOT'; 
        const DEFAULT_GOVERNANCE_PATH = 'config/governance';
        
        try {
            // The IPathRegistryKernel is responsible for providing the strategic path configuration.
            this.#configDirectory = await this.#pathRegistry.resolvePath(GOVERNANCE_CONFIG_DIR_KEY, DEFAULT_GOVERNANCE_PATH);
        } catch (e) {
             throw new Error(`[GovernanceLoaderKernel] Failed to resolve governance configuration path '${GOVERNANCE_CONFIG_DIR_KEY}': ${e.message}`);
        }
    }

    /**
     * Loads a specific governance policy configuration by name.
     * Caches the promise of the loading operation (promise memoization).
     * 
     * @param {string} policyName The name of the policy (e.g., 'security', 'resource_limits').
     * @returns {Promise<Object>} The parsed configuration object.
     */
    async load(policyName) {
        const cacheKey = policyName.toLowerCase();

        // 1. Check cache for existing promise or resolved value
        if (this.#cache.has(cacheKey)) {
            return this.#cache.get(cacheKey);
        }

        const fileName = `${cacheKey}.json`;
        // Construct the full path using the resolved config directory.
        // Note: Direct dependency on Node's 'path.join' has been removed.
        const fullPath = `${this.#configDirectory}/${fileName}`;

        // 2. Define the loading operation
        const loadOperation = this.#ioLoader.loadJson(fullPath)
            .catch(error => {
                // Remove failed promise from cache to allow retries
                this.#cache.delete(cacheKey);
                throw error;
            });
        
        // 3. Cache the promise immediately to prevent concurrent duplicate I/O operations (race conditions)
        this.#cache.set(cacheKey, loadOperation);

        // 4. Await and return the result
        return loadOperation;
    }

    /**
     * Utility method for accessing deeply nested configurations safely using dot notation.
     * @param {string} policyName The policy configuration to load.
     * @param {string} pathString Dot-separated path (e.g., 'limits.cpu').
     * @returns {Promise<any>} The value at the specified path, or undefined.
     */
    async get(policyName, pathString) {
        const config = await this.load(policyName);
        
        if (!pathString) return config;
        
        // Implements safe dot-notation traversal
        return pathString.split('.').reduce((acc, part) => {
            if (acc === undefined || acc === null) return undefined; 
            return acc[part];
        }, config);
    }

    /**
     * Clears all cached configuration promises, forcing a full reload on next access.
     */
    clearCache() {
        this.#cache.clear();
    }
}

module.exports = GovernanceLoaderKernel;