/**
 * Dynamic Policy Cache Kernel (DPC) V2
 * Loads and encapsulates ACVD constraints for optimized, low-latency axiomatic checks.
 * Ensures policy data is loaded asynchronously and is immutable post-initialization.
 */

class DynamicPolicyCacheKernel {
    // # Dependencies
    #acvdConfigRegistry;
    #integrityVetoChecker;
    #logger;

    // # Internal State (Policy Data)
    #VetoBounds: { max_pvlm_failures: number, max_mpam_failures: number } = {};
    #UtilityBounds: { UFRM: number } = {};
    #ContextRequired: boolean = false;
    #isInitialized = false;

    /**
     * Initializes the DPC Kernel, formalizing dependencies.
     * @param {object} dependencies
     * @param {ACVDPolicyConfigRegistryKernel} dependencies.acvdConfigRegistry - Asynchronously loads the ACVD configuration.
     * @param {IIntegrityVetoCheckerToolKernel} dependencies.integrityVetoChecker - Tool for executing low-latency veto checks.
     * @param {ILoggerToolKernel} dependencies.logger
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    #setupDependencies(dependencies) {
        const { acvdConfigRegistry, integrityVetoChecker, logger } = dependencies;

        if (!acvdConfigRegistry || typeof acvdConfigRegistry.getACVDConfiguration !== 'function') {
            throw new Error("[DynamicPolicyCacheKernel] Missing or invalid acvdConfigRegistry.");
        }
        // IIntegrityVetoCheckerToolKernel replaces synchronous global access to IntegrityVetoChecker
        if (!integrityVetoChecker || typeof integrityVetoChecker.check !== 'function') {
            throw new Error("[DynamicPolicyCacheKernel] Missing or invalid integrityVetoChecker.");
        }
        if (!logger) {
            throw new Error("[DynamicPolicyCacheKernel] Missing logger dependency.");
        }

        this.#acvdConfigRegistry = acvdConfigRegistry;
        this.#integrityVetoChecker = integrityVetoChecker;
        this.#logger = logger;
    }

    /**
     * Asynchronously initializes the cache by loading the ACVD configuration from the Registry.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.#isInitialized) {
            this.#logger.warn('DynamicPolicyCacheKernel is already initialized.');
            return;
        }

        this.#logger.info('Loading ACVD configuration...');

        try {
            const config = await this.#acvdConfigRegistry.getACVDConfiguration();

            const { policy_thresholds, attestation_requirements } = config;

            if (!policy_thresholds || !attestation_requirements) {
                 throw new Error("Configuration integrity failure: Missing required policy_thresholds or attestation_requirements.");
            }

            const { integrity_veto_bounds, utility_maximization } = policy_thresholds;
            const { ecvm_required } = attestation_requirements;

            // Assigning data and enforcing immutability on subsets
            this.#VetoBounds = Object.freeze(integrity_veto_bounds);
            this.#UtilityBounds = Object.freeze(utility_maximization);
            this.#ContextRequired = ecvm_required;

            // Policy cache must be immutable post-init
            Object.freeze(this);
            this.#isInitialized = true;
            this.#logger.info('DynamicPolicyCacheKernel initialized successfully.');

        } catch (error) {
            this.#logger.error('Failed to initialize DynamicPolicyCacheKernel by loading ACVD configuration.', { error: error.message });
            throw error; 
        }
    }

    _ensureInitialized() {
        if (!this.#isInitialized) {
            throw new Error("[DynamicPolicyCacheKernel] Must be initialized before use.");
        }
    }

    /**
     * Executes a low-latency check against critical integrity veto bounds (PVLM/MPAM).
     * Provides strict early exit optimization for governance breaches.
     * 
     * @param {Object} metrics - Runtime metrics { pvlm_failure_count, mpam_failure_count }.
     * @returns {boolean} True if the system state is valid and non-vetoable.
     */
    checkIntegrityVeto(metrics: { pvlm_failure_count: number, mpam_failure_count: number }): boolean {
        this._ensureInitialized();
        // Delegate the core comparison logic to the injected IIntegrityVetoCheckerToolKernel.
        return this.#integrityVetoChecker.check(
            metrics,
            this.#VetoBounds
        );
    }

    /**
     * Retrieves the Utility Function Runtime Metric (UFRM) bound.
     * @returns {number} The current UFRM bound.
     */
    getUFRMBound(): number {
        this._ensureInitialized();
        return this.#UtilityBounds.UFRM;
    }

    /**
     * Checks if Extended Context Validation Module (ECVM) is required.
     * @returns {boolean}
     */
    isContextValidationRequired(): boolean {
        this._ensureInitialized();
        return this.#ContextRequired;
    }
}

module.exports = DynamicPolicyCacheKernel;