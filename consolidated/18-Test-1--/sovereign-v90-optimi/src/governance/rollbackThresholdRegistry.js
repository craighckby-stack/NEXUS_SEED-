/**
 * RollbackThresholdManagerKernel (RTMK)
 * Refactored high-integrity kernel responsible for providing configuration access
 * to specific governance thresholds related to rollback constraints (C-15 parameters).
 *
 * This kernel eliminates critical architectural violations by replacing synchronous
 * utility initialization and generic configuration loaders with specialized,
 * asynchronous Tool Kernels, enforcing Maximum Recursive Abstraction (MRA).
 */
class RollbackThresholdManagerKernel {
    // Tool Kernels are used as dependencies, replacing generic interfaces and ad-hoc utilities.
    private healthRegistry; // GovernanceHealthConfigRegistryKernel
    private readonly ROLLBACK_SCOPE;

    /**
     * @param {GovernanceHealthConfigRegistryKernel} healthRegistry - Specialized config access for governance thresholds.
     * @param {IConceptIdRegistryKernel} conceptIdRegistry - Used to retrieve stable, auditable configuration scope IDs.
     */
    constructor(healthRegistry, conceptIdRegistry) {
        // 1. Dependency injection replaces generic IConfigLoader and removes synchronous VersionedConfigAccessUtility.
        this.healthRegistry = healthRegistry;
        
        // 2. Define scope key using a stable concept ID for auditable configuration scoping.
        this.ROLLBACK_SCOPE = conceptIdRegistry.getConceptId('SCOPE/GOVERNANCE/ROLLBACK_THRESHOLDS');
    }

    /** Mandatory asynchronous initialization method, ensuring non-blocking setup. */
    async initialize() {
        // Ensure the required configuration scope is loaded and ready before operation.
        await this.healthRegistry.ensureScopeLoaded(this.ROLLBACK_SCOPE);
    }

    /** Retrieves all current active thresholds used by the PolicyEngine. */
    async getCurrentThresholds() {
        // Delegation to specialized Registry Kernel.
        return await this.healthRegistry.getThresholdsByScope(this.ROLLBACK_SCOPE);
    }

    /**
     * Checks a specific threshold value against the active policy.
     * @param {string} key - The specific threshold identifier (e.g., 'maxEntropyDelta').
     */
    async getThreshold(key) {
        // Delegation to specialized Registry Kernel.
        return await this.healthRegistry.getThresholdValue(this.ROLLBACK_SCOPE, key);
    }
    
    /** Allows hot-swapping or versioning the policy definitions based on consensus. */
    setActiveVersion(versionId) {
        // Delegation of version management to the underlying config registry layer.
        this.healthRegistry.setActiveScopeVersion(this.ROLLBACK_SCOPE, versionId);
        // Note: Ad-hoc logging (console.log) is removed, relying on the registry's internal auditable logging.
    }
}

module.exports = RollbackThresholdManagerKernel;