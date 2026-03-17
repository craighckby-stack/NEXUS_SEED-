/**
 * Component ID: RTMK
 * Name: Resource Threshold Manager Kernel
 * Function: Asynchronously manages and provides high-integrity, environment-specific,
 *           and adaptively tuned resource constraint thresholds to the Constraint Evaluator.
 * GSEP Alignment: Stage 3 Configuration Support (P-01 Input refinement), AIA Enforcement Layer compliance.
 */

class ResourceThresholdManagerKernel {
    /**
     * @param {GovernanceHealthConfigRegistryKernel} governanceHealthConfigRegistryKernel - For loading base and profile thresholds (Async I/O).
     * @param {IAdaptiveParameterTunerToolKernel} adaptiveParameterTunerToolKernel - For applying dynamic, runtime adjustments (Async execution).
     * @param {EnvironmentTypeDecoderInterfaceKernel} environmentTypeDecoderInterfaceKernel - For asynchronously resolving the operational environment profile.
     */
    constructor(governanceHealthConfigRegistryKernel, adaptiveParameterTunerToolKernel, environmentTypeDecoderInterfaceKernel) {
        // Enforce asynchronous kernel dependencies
        this.ghcrk = governanceHealthConfigRegistryKernel;
        this.aptk = adaptiveParameterTunerToolKernel;
        this.etdik = environmentTypeDecoderInterfaceKernel;

        if (!this.ghcrk || !this.aptk || !this.etdik) {
            throw new Error("RTMK: Missing required Tool Kernel dependencies.");
        }

        /** @private {string|null} The resolved environment profile. */
        this.environmentProfile = null;
        /** @private {Object|null} Cache for the statically merged base configuration (Base + Profile Overrides). */
        this.baseConfigurationCache = null;
        /** @private {Object|null} Cache for the fully resolved and dynamically tuned configuration. */
        this.tunedConfigCache = null;
    }

    /**
     * Asynchronously initializes the kernel by resolving the environment and loading the static configuration.
     * This replaces the synchronous constructor logic and configuration access.
     * @async
     */
    async initialize() {
        if (this.baseConfigurationCache) {
            return;
        }
        
        // 1. Asynchronously determine the environment profile (e.g., 'production', 'staging')
        this.environmentProfile = await this.etdik.decodeEnvironment();

        // 2. Asynchronously load and merge base thresholds and environment specific overrides. 
        // Delegation to GHCRK ensures non-blocking I/O and strict configuration integrity.
        this.baseConfigurationCache = await this.ghcrk.getResourceThresholdConfig(this.environmentProfile);
        
        // Populate the initial tuned cache state
        await this.getTunedConstraintConfig(true);
    }
    
    /**
     * Public method to asynchronously retrieve the aggregated, adaptively tuned constraint configuration.
     * Caches the result unless explicitly requested to refresh.
     * @async
     * @param {boolean} [refresh=false] - Force recalculation even if cached.
     * @returns {Promise<Object>} Merged configuration object defining current operating constraints.
     */
    async getTunedConstraintConfig(refresh = false) {
        if (!this.baseConfigurationCache) {
             throw new Error("RTMK must be initialized before configuration retrieval.");
        }
        
        if (this.tunedConfigCache && !refresh) {
            return this.tunedConfigCache;
        }

        // 1. Start with the statically loaded configuration (Base + Profile)
        const currentConfig = this.baseConfigurationCache;
        
        // 2. Apply dynamic adjustments via the IAdaptiveParameterTunerToolKernel.
        // The APTK handles the complex, non-linear adjustment logic asynchronously.
        const finalConfig = await this.aptk.applyConstraintAdjustments(currentConfig, this.environmentProfile);

        // Ensure the output is immutable for integrity assurance
        this.tunedConfigCache = Object.freeze(finalConfig);
        
        return this.tunedConfigCache;
    }
}

module.exports = ResourceThresholdManagerKernel;