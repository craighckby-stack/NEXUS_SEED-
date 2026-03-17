/**
 * Represents a key-value mapping for configuration objects.
 */
interface Config {
    [key: string]: any;
}

/**
 * Defines the interface for a safe deep merge utility specialized for configuration.
 */
interface IConfigurationDeepMergeToolKernel {
    safeDeepMerge(target: Config, source: Config): Config;
}

/**
 * Processes and merges configuration layers from base, environment, and overrides.
 * Ensures input validation and uses a secure deep merging utility.
 */
export class RuntimeConfigProcessorKernel {
    private mergeTool: IConfigurationDeepMergeToolKernel;

    /**
     * @param mergeTool An instance of a safe configuration merging utility.
     */
    constructor(mergeTool: IConfigurationDeepMergeToolKernel) {
        this.#setupDependencies(mergeTool);
    }

    /**
     * Isolates dependency validation and assignment, ensuring synchronous setup extraction.
     * @param mergeTool The configuration merging utility.
     */
    #setupDependencies(mergeTool: IConfigurationDeepMergeToolKernel): void {
        if (!mergeTool || typeof mergeTool.safeDeepMerge !== 'function') {
            // OPTIMIZATION: Standardized dependency validation error to TypeError.
            throw new TypeError("Initialization failed: Required IConfigurationDeepMergeToolKernel dependency is missing or invalid (must implement safeDeepMerge function).");
        }
        this.mergeTool = mergeTool;
    }

    /**
     * Checks if the input is a non-null, non-array object suitable for configuration.
     * @param input The value to check.
     * @returns True if the input is a valid configuration object.
     */
    private isValidConfigInput(input: any): input is Config {
        return input !== null && typeof input === 'object' && !Array.isArray(input);
    }

    /**
     * Processes and merges configuration layers in ascending priority:
     * Base Config -> Environment Config -> Override Set.
     *
     * @param baseConfig The base configuration object.
     * @param environmentConfig The environment specific configuration (e.g., development, staging).
     * @param overrideSet The final set of manual overrides (highest precedence).
     * @returns The merged and validated configuration object.
     */
    public processConfig(
        baseConfig: Config | null,
        environmentConfig: Config | null,
        overrideSet: Config | null
    ): Config {

        // Normalize inputs to ensure they are valid Config objects or empty objects {}.
        const base = this.isValidConfigInput(baseConfig) ? baseConfig : {};
        const env = this.isValidConfigInput(environmentConfig) ? environmentConfig : {};
        const overrides = this.isValidConfigInput(overrideSet) ? overrideSet : {};

        // Start with an empty object to ensure the result is always a fresh deep copy.
        let resultConfig: Config = {};

        // 1. Merge Base Config into the result
        resultConfig = this.mergeTool.safeDeepMerge(resultConfig, base);

        // 2. Merge Environment Config into the result
        resultConfig = this.mergeTool.safeDeepMerge(resultConfig, env);

        // 3. Merge Overrides (highest precedence) into the result
        resultConfig = this.mergeTool.safeDeepMerge(resultConfig, overrides);

        return resultConfig;
    }
}