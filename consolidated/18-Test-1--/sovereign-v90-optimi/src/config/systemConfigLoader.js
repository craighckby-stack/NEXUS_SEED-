import { ICanonicalPathResolverToolKernel } from "../interfaces/ICanonicalPathResolverToolKernel.js";
import { IEnvironmentAccessKernel } from "../interfaces/IEnvironmentAccessKernel.js";
import { ILoggerKernel } from "../interfaces/ILoggerKernel.js";

// Assuming interfaces for configuration tools are defined elsewhere
// import { IConfigNormalizationToolKernel } from "../interfaces/IConfigNormalizationToolKernel.js";
// import { ISecureValueTransformerToolKernel } from "../interfaces/ISecureValueTransformerToolKernel.js";

/**
 * Raw constants defined locally until extracted to a specific registry (e.g., ConfigDefaultsRegistryKernel).
 * Strategic Goal: Remove raw constants from component logic.
 */
const CONFIG_CONSTANTS = Object.freeze({
    DIR: 'config',
    FILE_NAME: 'runtime.encrypted.json'
});


/**
 * A Kernel responsible for loading, decrypting, and providing the finalized application configuration.
 * Enforces Dependency Injection (DI) for path resolution, environment access, and core utilities.
 */
export class SystemConfigLoaderKernel {

    #configPath;
    
    // Injected Dependencies
    #pathResolverKernel;
    #environmentAccessKernel;
    #configNormalizationToolKernel;
    #secureValueTransformerToolKernel;
    #loggerKernel;

    /**
     * @param {ICanonicalPathResolverToolKernel} pathResolverKernel
     * @param {IEnvironmentAccessKernel} environmentAccessKernel
     * @param {IConfigNormalizationToolKernel} configNormalizationToolKernel
     * @param {ISecureValueTransformerToolKernel} secureValueTransformerToolKernel
     * @param {ILoggerKernel} loggerKernel
     */
    constructor(
        pathResolverKernel,
        environmentAccessKernel,
        configNormalizationToolKernel,
        secureValueTransformerToolKernel,
        loggerKernel
    ) {
        this.#pathResolverKernel = pathResolverKernel;
        this.#environmentAccessKernel = environmentAccessKernel;
        this.#configNormalizationToolKernel = configNormalizationToolKernel;
        this.#secureValueTransformerToolKernel = secureValueTransformerToolKernel;
        this.#loggerKernel = loggerKernel;

        this.#setupDependencies();
    }

    /**
     * Synchronously resolves path dependencies, replacing direct usage of path.resolve() and process.cwd().
     * Isolates synchronous initialization logic.
     */
    #setupDependencies() {
        const CWD = this.#delegateToEnvironmentAccessCWD();
        
        // Calculate the static configuration file path using injected canonical resolver
        this.#configPath = this.#delegateToPathResolution(
            CWD, 
            CONFIG_CONSTANTS.DIR, 
            CONFIG_CONSTANTS.FILE_NAME
        );
    }

    /**
     * I/O Proxy: Delegates path resolution to the injected tool.
     */
    #delegateToPathResolution(...segments) {
        // ICanonicalPathResolverToolKernel.resolve replaces path.resolve
        return this.#pathResolverKernel.resolve(...segments);
    }

    /**
     * I/O Proxy: Delegates retrieval of Current Working Directory.
     */
    #delegateToEnvironmentAccessCWD() {
        // IEnvironmentAccessKernel.getCWD() replaces process.cwd()
        return this.#environmentAccessKernel.getCWD();
    }
    
    /**
     * I/O Proxy: Delegates the core configuration loading and transformation process.
     * @param {string} filePath 
     * @param {Function} transformerFn - The secure value transformation function (ISecureValueTransformerToolKernel.transform).
     * @returns {Promise<Object>}
     */
    #delegateToConfigLoadAndTransform(filePath, transformerFn) {
        // IConfigNormalizationToolKernel.execute replaces ConfigNormalizationAndTransformationUtility.execute
        // We assume the new Kernel interface enforces async loading for robust I/O handling
        return this.#configNormalizationToolKernel.execute({
            filePath: filePath,
            transformer: transformerFn
        });
    }

    /**
     * Loads and decrypts the primary configuration file using the transformation utility.
     * @returns {Promise<Object>} The fully configured and decrypted system configuration object.
     */
    async loadConfig() {
        this.#loggerKernel.info(`Attempting to load configuration from ${this.#configPath}`);

        try {
            // Utilize the injected normalization tool, passing the injected transformer function.
            const config = await this.#delegateToConfigLoadAndTransform(
                this.#configPath,
                this.#secureValueTransformerToolKernel.transform
            );
            
            this.#loggerKernel.info('System configuration loaded and secrets successfully decrypted.');
            return config;

        } catch (e) {
            // Replace direct console interaction with injected logger
            this.#loggerKernel.error(`Configuration loading failed: ${e.message}`, { error: e, path: this.#configPath });
            throw e; 
        }
    }
}