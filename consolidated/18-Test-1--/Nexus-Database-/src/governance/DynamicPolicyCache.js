/**
 * Dynamic Policy Cache (DPC) Utility V2
 * Loads and encapsulates ACVD constraints for optimized, low-latency axiomatic checks.
 */

class DynamicPolicyCache {
    // Private fields ensure policy stability (immutability post-init)
    #VetoBounds;
    #UtilityBounds;
    #ContextRequired;

    /**
     * Initializes the DPC with pre-validated ACVD configuration.
     * @param {Object} config - ACVD constraints structure.
     * @param {Object} config.policy_thresholds - Contains governance bounds.
     * @param {Object} config.attestation_requirements - Contains EVCM requirements.
     */
    constructor({ policy_thresholds, attestation_requirements }) {
        // Input validation is streamlined, expecting schema validation to happen upstream (see scaffold).
        if (!policy_thresholds || !attestation_requirements) {
            throw new Error("[DPC] Initialization requires valid policy and attestation configurations.");
        }

        const { integrity_veto_bounds, utility_maximization } = policy_thresholds;
        const { ecvm_required } = attestation_requirements;

        // Direct assignment to private fields
        this.#VetoBounds = integrity_veto_bounds;
        this.#UtilityBounds = utility_maximization;
        this.#ContextRequired = ecvm_required;

        // Policy cache must be immutable to prevent runtime governance policy drift.
        Object.freeze(this);
    }

    /**
     * Executes a low-latency check against critical integrity veto bounds (PVLM/MPAM).
     * Provides strict early exit optimization for governance breaches.
     * 
     * @param {Object} metrics - Runtime metrics { pvlm_failure_count, mpam_failure_count }.
     * @returns {boolean} True if the system state is valid and non-vetoable.
     */
    checkIntegrityVeto({ pvlm_failure_count, mpam_failure_count }) {
        // Optimization: Use destructured metrics parameter for clean access.

        // PVLM Breach Check (Veto)
        if (pvlm_failure_count > this.#VetoBounds.max_pvlm_failures) {
            return false;
        }
        
        // MPAM Breach Check (Veto)
        if (mpam_failure_count > this.#VetoBounds.max_mpam_failures) {
            return false;
        }

        return true;
    }

    /**
     * Retrieves the Utility Function Runtime Metric (UFRM) bound.
     * @returns {number} The current UFRM bound.
     */
    getUFRMBound() {
        return this.#UtilityBounds.UFRM;
    }

    /**
     * Checks if Extended Context Validation Module (ECVM) is required.
     * @returns {boolean}
     */
    isContextValidationRequired() {
        return this.#ContextRequired;
    }
}

module.exports = DynamicPolicyCache;