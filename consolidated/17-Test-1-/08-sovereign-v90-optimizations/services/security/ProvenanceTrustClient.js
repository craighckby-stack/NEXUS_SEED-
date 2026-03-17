/**
 * Sovereign AGI - Data Trust Protocol Client (DTEM V3.0)
 * Handles lookup and execution of Trust Policies defined in config/security/data_trust_endpoints_v3.json
 */

class ProvenanceTrustClientKernel {
    #configLoader;
    #pvsConnector;
    #streamMatcherTool;
    #trustEvaluatorTool; 
    
    #config;
    #policies;
    #streams;
    #defaults;

    /**
     * @param {IConfigLoaderKernel} configLoader - Configuration management service.
     * @param {IPVSConnectorKernel} pvsConnector - Provenance Verification Service connection instance.
     * @param {IConfigStreamMatcherToolKernel} streamMatcherTool - Tool for matching endpoints to configuration streams.
     * @param {ITrustPolicyEvaluationEngineKernel} trustEvaluatorTool - Tool for executing trust policy evaluation.
     */
    constructor(configLoader, pvsConnector, streamMatcherTool, trustEvaluatorTool) {
        this.#configLoader = configLoader;
        this.#pvsConnector = pvsConnector;
        this.#streamMatcherTool = streamMatcherTool;
        this.#trustEvaluatorTool = trustEvaluatorTool;
        this.#setupDependencies();
    }

    /**
     * Rigorously checks dependencies, loads required configuration synchronously, and initializes internal state.
     * @private
     */
    #setupDependencies() {
        if (!this.#configLoader) {
            throw new Error("Dependency IConfigLoaderKernel is required for ProvenanceTrustClientKernel.");
        }
        if (!this.#pvsConnector) {
            throw new Error("Dependency IPVSConnectorKernel is required for ProvenanceTrustClientKernel.");
        }
        if (!this.#streamMatcherTool) {
            throw new Error("Dependency IConfigStreamMatcherToolKernel is required for ProvenanceTrustClientKernel.");
        }
        if (!this.#trustEvaluatorTool) {
            throw new Error("Dependency ITrustPolicyEvaluationEngineKernel is required for ProvenanceTrustClientKernel.");
        }

        this.#config = this.#delegateToConfigLoaderLoad('data_trust_endpoints_v3');
        
        if (!this.#config || !this.#config.trust_policies || !this.#config.data_streams || !this.#config.global_policy_defaults) {
             throw new Error("Failed to load critical data trust configuration or structure is invalid.");
        }

        this.#policies = this.#config.trust_policies;
        this.#streams = this.#config.data_streams;
        this.#defaults = this.#config.global_policy_defaults;
    }

    // --- I/O Proxies ---

    #delegateToConfigLoaderLoad(configName) {
        // Isolating synchronous config loading I/O
        return this.#configLoader.load(configName);
    }

    #delegateToStreamMatcherExecute(url) {
        // Isolating tool execution I/O (IConfigStreamMatcherToolKernel)
        return this.#streamMatcherTool.execute({
            target: url,
            patterns: this.#streams,
            patternKey: 'endpoint_pattern'
        });
    }

    async #delegateToPVSConnectorVerify(proofToken, level, keyId) {
        // Isolating external service communication I/O (IPVSConnectorKernel)
        return await this.#pvsConnector.verify(proofToken, level, keyId);
    }
    
    async #delegateToTrustEvaluatorExecute(streamConfig, metadata, pvsVerifier) {
         // Isolating tool execution I/O (ITrustPolicyEvaluationEngineKernel)
        // NOTE: runtimeTrustScore must be calculated based on input signals (Placeholder maintained)
        const runtimeTrustScore = 1.0; 

        return await this.#trustEvaluatorTool.execute({
            streamConfig: streamConfig,
            policies: this.#policies,
            defaults: this.#defaults,
            runtimeTrustScore: runtimeTrustScore,
            metadata: metadata,
            pvsVerifier: pvsVerifier 
        });
    }

    #logWarning(message) {
        console.warn(message);
    }
    
    #logError(message) {
        console.error(message);
    }

    #logSuccess(message) {
        console.log(message);
    }

    // --- Public Methods ---

    /**
     * Matches an incoming endpoint URL to a defined data stream configuration.
     * @param {string} url - The URL or identifier of the ingress point.
     * @returns {Object | null} The stream configuration or null.
     */
    findStreamConfiguration(url) {
        return this.#delegateToStreamMatcherExecute(url);
    }

    /**
     * Executes the trust evaluation pipeline for incoming data.
     * @param {string} endpointUrl - The data source URL.
     * @param {Object} metadata - Headers, checksums, proof tokens, etc.
     * @returns {Promise<boolean>} Trust validation result.
     */
    async validateTrust(endpointUrl, metadata) {
        const streamConfig = this.findStreamConfiguration(endpointUrl);
        
        if (!streamConfig) {
            this.#logWarning(`No explicit trust policy found for ${endpointUrl}. Denying access.`);
            return false;
        }

        // Define the PVS verification function closure, injecting the I/O proxy for verification delegation
        const pvsVerifier = async (proofToken, level, keyId) => {
            return await this.#delegateToPVSConnectorVerify(proofToken, level, keyId);
        };
        
        const evaluationResult = await this.#delegateToTrustEvaluatorExecute(streamConfig, metadata, pvsVerifier);

        if (!evaluationResult.success) {
            this.#logError(`Trust validation failed: ${evaluationResult.reason}`);
            return false;
        }

        // 3. Integrity Check: (Placeholder for checks not managed by the evaluation engine)
        // ... Implementation depends on I/O system ...

        this.#logSuccess(`Trust validation successful for stream ${streamConfig.stream_id}.`);
        return true;
    }
}

module.exports = ProvenanceTrustClientKernel;