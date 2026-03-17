// src/governance/AdaptiveConstantManager.js

/**
 * Manages and merges static governance constants with dynamic, runtime-adjusted overlays.
 * Provides asynchronous initialization and handles the lifecycle of dynamic configuration polling.
 */
class AdaptiveConstantManager {
    
    /**
     * @param {object} dependencies
     * @param {IConfigurationMergerTool} dependencies.configMergerTool - Tool for deep merging configurations.
     * @param {IPollingConfigurationSourceTool} dependencies.pollingSourceTool - Factory for dynamic configuration polling.
     * @param {IGovernanceApiFetcherTool} dependencies.governanceApiFetcherTool - Interface for fetching dynamic constants.
     * @param {ILoggerTool} dependencies.loggerTool - Standard logging utility.
     * @param {IGovernanceConstantsRegistry} dependencies.constantsRegistry - Registry for static constants.
     */
    constructor(dependencies) {
        this.#validateAndSetDependencies(dependencies);
        
        /** @private {object} The current merged configuration (static + dynamic overlay). */
        this.currentConfig = {};
        /** @private {object | null} An instance representing the active polling source. */
        this.dynamicSource = null; 
    }

    /**
     * Validates and assigns all required dependencies.
     * @private
     */
    #validateAndSetDependencies(dependencies) {
        const required = [
            'configMergerTool', 'pollingSourceTool', 
            'governanceApiFetcherTool', 'loggerTool', 
            'constantsRegistry'
        ];

        for (const dep of required) {
            if (!dependencies[dep]) {
                throw new Error(`AdaptiveConstantManager requires dependency: ${dep}.`);
            }
        }

        /** @private */
        this.configMerger = dependencies.configMergerTool;
        /** @private */
        this.pollingSourceTool = dependencies.pollingSourceTool;
        /** @private */
        this.apiFetcher = dependencies.governanceApiFetcherTool;
        /** @private */
        this.logger = dependencies.loggerTool;
        /** @private */
        this.constantsRegistry = dependencies.constantsRegistry;
    }

    /**
     * Initializes the manager by loading static constants and setting up dynamic polling.
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const staticConstants = await this.constantsRegistry.getConstants();
            this.currentConfig = this.configMerger.deepMerge({}, staticConstants);

            const overlayConfig = this.getConstant('dynamic_overlay_source');
            
            if (overlayConfig?.enabled) {
                await this.#setupDynamicFetching(overlayConfig);
            }
        } catch (error) {
            this.logger.error('Failed to initialize AdaptiveConstantManager. Dynamic constants may be unavailable.', { error });
            throw error;
        }
    }

    /**
     * @private
     * Sets up the polling source for dynamic configuration updates.
     * @param {object} overlayConfig - Configuration for the polling source.
     * @returns {Promise<void>}
     */
    async #setupDynamicFetching(overlayConfig) {
        const fallbackInterval = this.getConstant('governance_intervals.telemetry_reporting_ms') ?? 15000; 

        this.dynamicSource = await this.pollingSourceTool.create(
            overlayConfig, 
            this.apiFetcher.fetchConstants,
            (newConfig) => this.mergeConfig(newConfig),
            fallbackInterval
        );

        await this.dynamicSource.start();
    }

    /**
     * Merges a dynamic overlay into the current configuration state.
     * @param {object} overlay - The new configuration snippet.
     * @returns {void}
     */
    mergeConfig(overlay) {
        const prevConfigJson = JSON.stringify(this.currentConfig); 
        this.currentConfig = this.configMerger.deepMerge(this.currentConfig, overlay);
        
        if (prevConfigJson !== JSON.stringify(this.currentConfig)) {
            this.logger.info('Governance constants updated dynamically.', { source: 'dynamic_overlay' });
        }
    }

    /**
     * Retrieves a nested constant value from the current configuration.
     * @param {string} path - Dot-separated path (e.g., 'execution_policy.max_recursion_depth').
     * @returns {*} The constant value, or undefined if not found.
     */
    getConstant(path) {
        if (!path || typeof path !== 'string') return undefined;

        try {
            return path.split('.').reduce((obj, key) => {
                return (obj && typeof obj === 'object' && obj !== null) ? obj[key] : undefined;
            }, this.currentConfig);
        } catch (e) {
            this.logger.error(`Error retrieving constant for path: ${path}`, { error: e.message });
            return undefined;
        }
    }

    /**
     * Stops the dynamic configuration polling process, if active.
     * @returns {Promise<void>}
     */
    async stop() {
        if (this.dynamicSource) {
            await this.dynamicSource.stop();
            this.dynamicSource = null;
            this.logger.info('Dynamic polling stopped.');
        }
    }
}

export default AdaptiveConstantManager;
