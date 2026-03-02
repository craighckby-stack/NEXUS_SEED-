// RTR: Rollback Threshold Registry (Config Store for PolicyEngine)

/**
 * The RTR maintains the current active set of governance thresholds (C-15 parameters)
 * that determine acceptable behavior post-mutation. These values are highly sensitive
 * and typically subject to internal governance consensus votes (P-01/P-02 outcome data).
 * 
 * This allows the PolicyEngine to operate purely as an evaluator, abstracting policy
 * configuration away from execution logic, supporting dynamic, versioned policies.
 */
class RollbackThresholdRegistry {
    constructor(configService) {
        // configService handles loading structured threshold data from a durable store (D-02)
        this.configService = configService;
        this.activeVersion = 'v1.0.0'; 
    }

    /** Retrieves all current active thresholds used by the PolicyEngine. */
    async getCurrentThresholds() {
        return await this.configService.load('governance.rollback.thresholds', this.activeVersion);
    }

    /**
     * Checks a specific threshold value against the active policy.
     * @param {string} key - The specific threshold identifier (e.g., 'maxEntropyDelta').
     */
    async getThreshold(key) {
        const thresholds = await this.getCurrentThresholds();
        return thresholds[key];
    }
    
    /** Allows hot-swapping or versioning the policy definitions based on consensus. */
    setActiveVersion(versionId) {
        this.activeVersion = versionId;
        console.log(`RTR policy version set to ${versionId}`);
    }
}

module.exports = RollbackThresholdRegistry;