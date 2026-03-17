/**
 * IntegrityManifestKernel
 * Manages the creation, loading, and comprehensive validation of system integrity manifests.
 * A manifest (e.g., integrity.json) maps relative file paths to their expected cryptographic hashes (SHA-256 assumed).
 */
class IntegrityManifestKernel {
    // Dependencies
    #integrityHashKernel;
    #batchProcessorTool;
    #secureResourceLoader;
    #manifestErrorConstructor;

    /**
     * @param {object} dependencies
     * @param {IIntegrityHashKernel} dependencies.integrityHashKernel
     * @param {IBatchProcessorToolKernel} dependencies.batchProcessorTool
     * @param {SecureResourceLoaderInterfaceKernel} dependencies.secureResourceLoader
     * @param {new (...args: any[]) => IntegrityManifestError} dependencies.manifestErrorConstructor
     */
    constructor(dependencies = {}) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Private method to enforce synchronous setup extraction mandate.
     * @param {object} dependencies 
     */
    #setupDependencies(dependencies) {
        const { 
            integrityHashKernel, 
            batchProcessorTool, 
            secureResourceLoader, 
            manifestErrorConstructor 
        } = dependencies;

        const validateDependency = (dep, name, methods) => {
            if (!dep || !methods.every(method => typeof dep[method] === 'function')) {
                throw new Error(`${this.constructor.name}: Missing or invalid ${name} dependency.`);
            }
        };

        validateDependency(integrityHashKernel, 'integrityHashKernel', ['hashFileAsync']);
        validateDependency(batchProcessorTool, 'batchProcessorTool', ['execute']);
        validateDependency(secureResourceLoader, 'secureResourceLoader', ['loadJson', 'saveJson']);
        validateDependency(manifestErrorConstructor, 'manifestErrorConstructor', []);
        
        this.#integrityHashKernel = integrityHashKernel;
        this.#batchProcessorTool = batchProcessorTool;
        this.#secureResourceLoader = secureResourceLoader;
        this.#manifestErrorConstructor = manifestErrorConstructor;
    }

    async initialize() {
        // Standard kernel initialization hook
    }

    /**
     * Generates a manifest for a list of file paths.
     *
     * @param {string[]} filePaths Array of relative file paths.
     * @returns {Promise<Record<string, string>>} A map of relativePath -> hash.
     * @throws {IntegrityManifestError} If any file fails to hash.
     */
    async generateManifest(filePaths) {
        const workerFn = async (filePath) => {
            const hash = await this.#integrityHashKernel.hashFileAsync(filePath);
            return hash;
        };

        const { successes, failures } = await this.#batchProcessorTool.execute(filePaths, workerFn);
        
        const manifest = successes.reduce((acc, { item, result }) => {
            acc[item] = result;
            return acc;
        }, {});

        if (failures.length > 0) {
            const errors = failures.map(({ item, error }) => 
                `${item}: Failed to hash file: ${error.message || error}`
            );

            throw new this.#manifestErrorConstructor(
                `Manifest generation failed for ${failures.length} file(s).`,
                errors,
                'GENERATION'
            );
        }

        return manifest;
    }
    
    /**
     * Saves the manifest object to a JSON file.
     * @param {string} manifestPath Path where the manifest should be saved.
     * @param {Record<string, string>} manifest The manifest object (relativePath -> hash).
     */
    async saveManifest(manifestPath, manifest) {
        await this.#secureResourceLoader.saveJson(manifestPath, manifest);
    }

    /**
     * Loads and validates a stored manifest against the current filesystem.
     * Validation is performed concurrently.
     * 
     * @param {string} manifestPath Path to the stored manifest file.
     * @returns {Promise<{valid: boolean, errors: string[]}>} Detailed validation result.
     * @throws {IntegrityManifestError} If the manifest file cannot be loaded or parsed.
     */
    async validateManifest(manifestPath) {
        let expectedManifest;
        
        try {
            expectedManifest = await this.#secureResourceLoader.loadJson(manifestPath);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            throw new this.#manifestErrorConstructor(
                `Failed to load or parse manifest file ${manifestPath}.`,
                [error],
                'LOAD'
            );
        }

        const workerFn = async ([filePath, expectedHash]) => {
            const calculatedHash = await this.#integrityHashKernel.hashFileAsync(filePath);
            
            if (calculatedHash !== expectedHash) {
                const truncatedHash = (hash) => hash.substring(0, 10);
                
                throw new Error(`Integrity mismatch. Expected: ${truncatedHash(expectedHash)}..., Got: ${truncatedHash(calculatedHash)}...`);
            }
            return true;
        };

        const { failures } = await this.#batchProcessorTool.execute(Object.entries(expectedManifest), workerFn);
        
        const errors = failures.map(({ item: [filePath], error }) => {
            if (error.message.startsWith('Integrity mismatch')) {
                 return `Integrity mismatch for ${filePath}. ${error.message}`;
            }
            
            return `Validation failure (file access/hashing) for ${filePath}: ${error.message}`;
        });
        
        return { valid: errors.length === 0, errors };
    }
}

module.exports = IntegrityManifestKernel;
