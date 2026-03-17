class GovernanceApiAdapter {
    /**
     * @param {string} endpoint - The configuration API URL.
     * @param {SecureResourceLoaderInterface} secureLoader - Tool for secure resource fetching.
     * @param {ILogger} logger - Standard logging dependency.
     */
    constructor(endpoint, secureLoader, logger) {
        this.endpoint = endpoint;
        this.secureLoader = secureLoader;
        this.logger = logger;
        this.#validateDependencies();
    }

    /**
     * Validates all required dependencies are present and valid.
     * @private
     */
    #validateDependencies() {
        if (!this.endpoint || typeof this.endpoint !== 'string') {
            throw new Error("GovernanceApiAdapter requires a valid configuration endpoint (string).");
        }
        
        if (!this.secureLoader || typeof this.secureLoader.loadJson !== 'function') {
            throw new Error("GovernanceApiAdapter requires a valid SecureResourceLoaderInterface (must implement loadJson).");
        }
        
        if (!this.logger || typeof this.logger.info !== 'function') {
            throw new Error("GovernanceApiAdapter requires a valid ILogger.");
        }
    }

    /**
     * Fetches the latest dynamic governance configuration from the external endpoint.
     * @returns {Promise<object>} The configuration object.
     * @throws {Error} When the fetch operation fails.
     */
    async fetchLatestConfig() {
        this.logger.info(`[GovernanceApiAdapter] Fetching configuration from: ${this.endpoint}`);
        
        try {
            const config = await this.secureLoader.loadJson(this.endpoint, { timeout: this.#REQUEST_TIMEOUT });
            return config;
        } catch (error) {
            this.logger.error(`[GovernanceApiAdapter] Fetch failed for ${this.endpoint}: ${error.message}`, { error });
            throw new Error(`GOVERNANCE_ADAPTER_FETCH_FAILURE: Failed to retrieve configuration from ${this.endpoint}: ${error.message}`);
        }
    }

    /** @type {number} */
    static #REQUEST_TIMEOUT = 5000;
}

module.exports = GovernanceApiAdapter;
