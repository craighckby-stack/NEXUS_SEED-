/**
 * DependencyLoaderKernel
 * This Kernel encapsulates the mechanism for resolving module paths or service names
 * by leveraging injected utility and environment loader dependencies, ensuring
 * architectural separation and testability.
 */
class DependencyLoaderKernel {
    /** @type {IDependencyLookupToolKernel} */
    #dependencyLookupUtility;
    
    /** @type {IEnvironmentLoaderToolKernel} */
    #environmentLoader;

    /**
     * @param {object} dependencies
     * @param {IDependencyLookupToolKernel} dependencies.dependencyLookupUtility
     * @param {IEnvironmentLoaderToolKernel} dependencies.environmentLoader
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Isolates dependency setup and validation from the constructor,
     * rigorously satisfying synchronous setup extraction.
     * @param {object} dependencies
     * @private
     */
    #setupDependencies(dependencies) {
        if (!dependencies) {
            throw new Error("Dependencies must be provided to DependencyLoaderKernel.");
        }

        const { dependencyLookupUtility, environmentLoader } = dependencies;

        // Validation of IDependencyLookupToolKernel
        if (!dependencyLookupUtility || typeof dependencyLookupUtility.executeLookup !== 'function') {
            throw new TypeError("IDependencyLookupToolKernel (dependencyLookupUtility) must be provided with an executeLookup method.");
        }
        this.#dependencyLookupUtility = dependencyLookupUtility;

        // Validation of IEnvironmentLoaderToolKernel
        if (!environmentLoader) {
            throw new TypeError("IEnvironmentLoaderToolKernel (environmentLoader) must be provided.");
        }
        this.#environmentLoader = environmentLoader;
    }

    /**
     * Resolves a dependency synchronously using the configured utility and environment loader.
     * This replaces the functionality previously exposed by defaultServiceLoader.
     *
     * @param {string} serviceName - The name or path of the service/module to load.
     * @returns {any | null} The loaded module or null upon failure.
     */
    resolveDependencySync(serviceName) {
        // Delegate the synchronous execution and error handling to the reusable tool,
        // passing the injected environment loader.
        return this.#dependencyLookupUtility.executeLookup(
            serviceName, 
            this.#environmentLoader
        );
    }
}

module.exports = DependencyLoaderKernel;