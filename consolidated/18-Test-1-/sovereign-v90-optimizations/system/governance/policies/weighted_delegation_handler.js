/**
 * Policy Handler: Weighted Delegation v2 (WDPv2)
 * Responsibility: Implements the complex logic for multi-subsystem consensus weighting.
 * ClaraResolver orchestrates and logs, this module executes the core policy decision.
 */

const RESOLUTION_STATUS = require('../../utils/resolution_constants').RESOLUTION_STATUS; // Assuming utility constants

// Default threshold if not provided via policy configuration
const DEFAULT_POLICY_THRESHOLD = 0.70;

class WeightedDelegationHandler {
    /**
     * @param {object} dependencies - Required external services (e.g., SubsystemAuthorityRegistry, TrustScoreAggregator, ConsensusPolicyDecisionMaker).
     */
    constructor(dependencies) {
        this.authorityRegistry = dependencies.authorityRegistry;
        this.trustAggregator = dependencies.trustAggregator;
        // Assume the plugin is injected
        this.decisionMaker = dependencies.ConsensusPolicyDecisionMaker;
        // Policy threshold should be configurable, defaulting if not found.
        this.threshold = dependencies.policyConfig?.threshold ?? DEFAULT_POLICY_THRESHOLD;
    }

    /**
     * Executes the weighted delegation resolution process.
     * @param {object} proposal - The conflict proposal object.
     * @param {object} metricData - Operational and risk metrics.
     * @returns {Promise<{status: string, details: object}>}
     */
    async execute(proposal, metricData) {
        this.trustAggregator.preProcess(proposal, metricData);

        const delegatedVotes = await this.authorityRegistry.queryAllAuthorities(proposal.type);

        // 1. Calculate weighted trust score based on authority delegation matrix.
        const finalScore = this.trustAggregator.aggregate(delegatedVotes);

        // 2. Delegate threshold checking and result formatting to the dedicated utility.
        return this.decisionMaker.execute({
            consensusScore: finalScore.consensus,
            requiredThreshold: this.threshold,
            resolutionConstants: RESOLUTION_STATUS
        });
    }
}

module.exports = WeightedDelegationHandler;
