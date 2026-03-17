/**
 * SMAPolicyConfigurationKernel V2.0
 * High-integrity kernel for securely retrieving Schema Migration Adjudicator (SMA) parameters.
 * This replaces the synchronous GovernancePolicyEngine utility, adhering to the AIA Enforcement 
 * Layer mandates for asynchronous execution, explicit initialization, and dependency injection.
 */

import { IConfigurationDefaultsRegistryKernel } from "@AGI_KERNEL/IConfigurationDefaultsRegistryKernel";

/**
 * Standardized error for configuration loading failures, including conceptId for auditable processing.
 */
class GovernanceConfigurationLoadingError extends Error {
    /**
     * @param {string} message
     * @param {string} conceptId - Standardized error identifier (e.g., GOV_E_999).
     */
    constructor(message, conceptId = 'GOV_E_999') {
        super(message);
        this.name = 'GovernanceConfigurationLoadingError';
        this.conceptId = conceptId;
        // Note: Full error normalization is delegated to IErrorDetailNormalizationToolKernel.
    }
}

export class SMAPolicyConfigurationKernel {
    /**
     * @private
     * @type {IConfigurationDefaultsRegistryKernel}
     */
    #configRegistry;
    
    /**
     * @private
     * Internal cache for SMA parameters, replacing the synchronous static cache.
     * @type {object | null}
     */
    #s_SMAParamsCache = null;

    /**
     * @param {IConfigurationDefaultsRegistryKernel} configRegistry - The configuration defaults registry.
     */
    constructor(configRegistry) {
        if (!configRegistry) {
            throw new Error("Dependency Injection Error: IConfigurationDefaultsRegistryKernel is required.");
        }
        this.#configRegistry = configRegistry;
    }

    /**
     * Asynchronously loads and caches the SMA parameters during system initialization.
     * This ensures policy parameters are immutable and ready for high-speed access,
     * replacing synchronous, ad-hoc loading.
     * @async
     */
    async initialize() {
        // Canonical key assumption for SMA configuration, securely retrieved via Registry.
        const CONFIG_KEY = 'governance.policy.sma'; 

        try {
            const config = await this.#configRegistry.get(CONFIG_KEY);
            
            if (!config || typeof config.WEIGHTS !== 'object' || typeof config.THRESHOLDS !== 'object') {
                throw new GovernanceConfigurationLoadingError(
                    `SMAPolicyConfigurationKernel: Retrieved config for '${CONFIG_KEY}' is incomplete or malformed.`
                );
            }
            
            // Cache the result to enable fast retrieval.
            this.#s_SMAParamsCache = config;
            
        } catch (error) {
            if (error instanceof GovernanceConfigurationLoadingError) {
                throw error;
            }
            throw new GovernanceConfigurationLoadingError(
                `Failed to initialize SMAPolicyConfigurationKernel via registry access. Details: ${error.message}`
            );
        }
    }

    /**
     * Retrieves current configuration parameters relevant to the Schema Migration Adjudicator.
     * Accesses the pre-loaded internal cache via an asynchronous interface, ensuring adherence
     * to the non-blocking execution mandate.
     * 
     * @returns {Promise<{WEIGHTS: {[key: string]: number}, THRESHOLDS: {[key: string]: number}}>} Current governance parameters for SMA.
     */
    async getSMAParams() {
        if (!this.#s_SMAParamsCache) {
            throw new GovernanceConfigurationLoadingError(
                "SMAPolicyConfigurationKernel is uninitialized. Call initialize() before accessing parameters.",
                'GOV_E_998'
            );
        }
        return this.#s_SMAParamsCache;
    }
}