// src/governance/AdaptiveConstantManagerKernel.js

/**
 * Manages and merges static governance constants with dynamic, runtime-adjusted overlays.
 * Provides asynchronous initialization and handles the lifecycle of dynamic configuration polling.
 */
class AdaptiveConstantManagerKernel {

    /**
     * @param {object} dependencies
     * @param {IConfigurationMergerToolKernel} dependencies.configMergerToolKernel - Tool for deep merging configurations.
     * @param {IPollingConfigurationSourceToolKernel} dependencies.pollingSourceToolKernel - Factory for dynamic configuration polling.
     * @param {IGovernanceApiFetcherToolKernel} dependencies.governanceApiFetcherToolKernel - Interface for fetching dynamic constants.
     * @param {ILoggerToolKernel} dependencies.loggerToolKernel - Standard logging utility.
     * @param {IGovernanceConstantsV2ConfigRegistryKernel} dependencies.constantsRegistryKernel - Registry for static constants.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);

        /** @private {object} The current merged configuration (static + dynamic overlay). */
        this.currentConfig = {};
        /** @private {object | null} An instance representing the active polling source, managed by the PollingSource tool. */
        this.dynamicSource = null;
    }

    /**
     * Synchronously validates and assigns all required dependencies.
     * @private
     */
    #setupDependencies(dependencies) {
        const required = [
            'configMergerToolKernel', 'pollingSourceToolKernel',
            'governanceApiFetcherToolKernel', 'loggerToolKernel',
            'constantsRegistryKernel'
        ];

        for (const dep of required) {
            if (!dependencies[dep]) {
                throw new Error(`AdaptiveConstantManagerKernel requires dependency: ${dep}.`);
            }
        }

        /** @private */
        this.configMerger = dependencies.configMergerToolKernel;
        /** @private */
        this.PollingSource = dependencies.pollingSourceToolKernel;
        /** @private */
        this.fetcher = dependencies.governanceApiFetcherToolKernel;
        /** @private */
        this.logger = dependencies.loggerToolKernel;
        /** @private */
        this.constantsRegistry = dependencies.constantsRegistryKernel;
    }

    /**
     * Initializes the kernel by loading static constants and setting up dynamic polling.
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const staticConstants = await this.constantsRegistry.getConstants();

            // Initialize config with a deep copy of static constants using the merger tool
            this.currentConfig = this.configMerger.deepMerge({}, staticConstants);

            const overlaySource = this.getConstant('dynamic_overlay_source');

            if (overlaySource && overlaySource.enabled) {
                await this.#setupDynamicFetching(overlaySource);
            }
        } catch (error) {
            this.logger.error('AdaptiveConstantManagerKernel failed during initialization. Dynamic constants may be unavailable.', { error });
            // Note: If initialization fails, the static config might still be partially loaded, but we re-throw critical errors.
            throw error;
        }
    }

    /**
     * @private
     * Sets up the polling source for dynamic configuration updates.
     * @param {object} source - Configuration for the polling source.
     * @returns {Promise<void>}
     */
    async #setupDynamicFetching(source) {
        const fallbackInterval = this.getConstant('governance_intervals.telemetry_reporting_ms') || 15000;

        // Use the injected PollingSource tool to create and manage the polling instance.
        this.dynamicSource = await this.PollingSource.create(
            source,
            this.fetcher.fetchConstants, // Assuming the fetcher kernel exposes a suitable async method
            (newConfig) => this.mergeConfig(newConfig), // Success Callback
            fallbackInterval
        );

        // Start the polling process
        await this.dynamicSource.start();
    }

    /**
     * Merges a dynamic overlay into the current configuration state.
     * Note: This remains synchronous, manipulating internal state via the injected tool.
     * @param {object} overlay - The new configuration snippet.
     * @returns {void}
     */
    mergeConfig(overlay) {
        const prevConfigJson = JSON.stringify(this.currentConfig);
        this.currentConfig = this.configMerger.deepMerge(this.currentConfig, overlay);

        if (prevConfigJson !== JSON.stringify(this.currentConfig)) {
            this.logger.info('AdaptiveConstantManagerKernel: Governance constants updated dynamically. Configuration delta applied.', { source: 'dynamic_overlay' });
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
            // Use standard JS path reduction. Abstracting this to IJsonPathQueryToolKernel
            // is only necessary for complex, parameterized queries.
            return path.split('.').reduce((o, i) => {
                if (!o || typeof o !== 'object' || o === null) return undefined;
                return o[i];
            }, this.currentConfig);
        } catch (e) {
            this.logger.error(`Error during constant retrieval for path: ${path}`, { message: e.message });
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
            this.logger.info('AdaptiveConstantManagerKernel polling management stopped.');
        }
    }
}

export default AdaptiveConstantManagerKernel;
