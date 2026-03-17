/**
 * VetoConfigLoaderKernel
 * Responsible for locating, loading, caching, and validating
 * the VETO trigger configurations based on system environment or target Asset ID.
 *
 * Adheres to Kernel Architecture Standards: rigorous state privatization, 
 * extracted synchronous setup, and I/O proxy isolation.
 */

import fs from 'fs/promises';
import path from 'path';

// Define the interface for the injected utility
type ConfigUtility = { 
    execute: (args: { key: string, data?: object, defaults?: object, normalize?: boolean, clear?: boolean }) => any 
};

class VetoConfigLoaderKernel {
    // Rigorously privatized state and dependencies
    #configManager: ConfigUtility;
    #assetId: string;
    #defaultConfigPath: string;
    #vetoConfigDefaults: object;

    constructor(options = {}, configManagerTool: ConfigUtility) {
        this.#setupDependencies(options, configManagerTool);
    }

    /**
     * Executes synchronous dependency validation and assignment.
     * Satisfies the synchronous setup extraction strategic goal.
     * @private
     */
    #setupDependencies(options: object, configManagerTool: ConfigUtility): void {
        // 1. Dependency Validation
        if (!configManagerTool || typeof configManagerTool.execute !== 'function') {
            this.#throwSetupError("Config Manager Utility dependency is missing or invalid.");
        }

        // 2. Assignment
        this.#assetId = options.assetId || 'default';
        this.#configManager = configManagerTool;

        // 3. Define Internal Constants (to avoid external module scope)
        this.#defaultConfigPath = path.resolve(__dirname, '../../assets/GAX/AHMID_VETO_TRIGGERS.json');
        this.#vetoConfigDefaults = {
            high_trigger_threshold: 3, // Default weight/count
            vector_definitions: {}     // Ensure this is present for safe iteration
        };
    }

    /**
     * I/O Proxy: Handles delegation to the external ConfigManager utility.
     * @private
     */
    #delegateToConfigManagerExecute(args: { key: string, data?: object, defaults?: object, normalize?: boolean, clear?: boolean }): any {
        return this.#configManager.execute(args);
    }

    /**
     * I/O Proxy: Handles non-blocking file I/O (reading raw config from disk).
     * @private
     * @returns {Promise<object>} The raw configuration data.
     */
    async #readConfigFileAndThrow(): Promise<object> {
        try {
             const fileContent = await fs.readFile(this.#defaultConfigPath, 'utf8');
             return JSON.parse(fileContent);
        } catch (e) {
            this.#throwFileReadError(this.#defaultConfigPath, e);
        }
    }

    /**
     * I/O Proxy: Throws a setup error.
     * @private
     */
    #throwSetupError(message: string): never {
        throw new Error(`VetoConfigLoaderKernel Setup Error: ${message}`);
    }

    /**
     * I/O Proxy: Throws a descriptive file read error.
     * @private
     */
    #throwFileReadError(absolutePath: string, originalError: Error): never {
        throw new Error(`Failed to read/parse configuration file at ${absolutePath}. Error details: ${originalError.message}`);
    }

    /**
     * I/O Proxy: Logs a critical failure and returns a safe configuration structure.
     * @private
     */
    #logCriticalErrorAndReturnFailSafe(error: Error): object {
        // Use console.error for external visibility of critical failures
        console.error(`CRITICAL: Error loading Veto Triggers for Asset ${this.#assetId}. Returning fail-safe defaults. Details: ${error.message}`);
        
        // Fail-safe structure prevents runtime crashes
        return { vector_definitions: {} }; 
    }

    /**
     * Dynamically loads the VETO triggers for the configured asset/environment.
     * @returns {Promise<object>} The loaded and validated configuration.
     */
    async loadVetoTriggers(): Promise<object> {
        const cacheKey = this.#assetId;
        
        try {
            // 1. Check cache using I/O proxy
            const cachedConfig = this.#delegateToConfigManagerExecute({ key: cacheKey });
            if (cachedConfig) {
                return cachedConfig;
            }

            // 2. Load Raw Data (Awaits non-blocking I/O via proxy)
            const configData = await this.#readConfigFileAndThrow();
            
            // 3. Apply normalization and cache the result using I/O proxy
            const normalizedConfig = this.#delegateToConfigManagerExecute({ 
                key: cacheKey, 
                data: configData, 
                defaults: this.#vetoConfigDefaults,
                normalize: true 
            });

            return normalizedConfig;

        } catch (error) {
            // I/O Proxy handles logging and fail-safe return
            return this.#logCriticalErrorAndReturnFailSafe(error);
        }
    }

    /**
     * Clears the configuration cache for a specific asset (useful for runtime updates).
     * @param {string} key
     */
    clearCache(key = this.#assetId): void {
        this.#delegateToConfigManagerExecute({ key, clear: true });
    }
}

export default VetoConfigLoaderKernel;