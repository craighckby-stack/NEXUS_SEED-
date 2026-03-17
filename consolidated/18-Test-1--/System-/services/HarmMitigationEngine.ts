export class HarmMitigationEngine {

    private policyConfig: any;
    private initialized: boolean = false;

    constructor(policyConfigPath: string = 'config/HARM.json') {
        // Assuming an environment capable of synchronous config loading for initialization
        // In a production scenario, this should be async and memoized.
        try {
            this.policyConfig = require(policyConfigPath);
            this.initialized = true;
        } catch (error) {
            console.error("HARM Mitigation Engine failed to load configuration:", error);
            // Fail-safe: Use hardcoded severe defaults if config fails to load.
            this.policyConfig = { default_action: "BLOCK" };
        }
    }

    /**
     * Analyzes input based on scores and executes mandated policy actions.
     * @param detectionScores Object mapping category to detected harm score (0.0 to 1.0).
     * @returns The enforced action and the chosen mitigation strategy.
     */
    public async enforcePolicy(detectionScores: { [category: string]: number }, contextTags: string[] = []): Promise<{ enforcedAction: string, mitigation: string }> {
        if (!this.initialized) {
            console.warn("HARM Engine uninitialized. Returning default action.");
            return { enforcedAction: this.policyConfig.default_action, mitigation: 'LOG' };
        }

        let highestRiskRule: any = null;
        let highestRiskScore = 0.0;

        for (const rule of this.policyConfig.rules) {
            const score = detectionScores[rule.category] || 0.0;
            if (score >= rule.threshold && score > highestRiskScore) {
                highestRiskRule = rule;
                highestRiskScore = score;
            }
        }

        if (highestRiskRule) {
            // Basic exemption check (simplistic for scaffold, complex logic belongs elsewhere)
            const isExempt = contextTags.some(tag => 
                this.policyConfig.contextual_exemptions.some((exemption: any) => 
                    exemption.context_tag === tag && this.isSeverityExempt(highestRiskRule.severity, exemption.max_severity_override)
                )
            );

            if (isExempt) {
                // Log the potential violation but apply default/no action
                console.log(`HARM policy bypassed for context: ${highestRiskRule.category} score ${highestRiskScore}`);
                return { enforcedAction: 'PASS_WITH_LOG', mitigation: highestRiskRule.mitigation_strategy };
            } 

            return { 
                enforcedAction: highestRiskRule.action,
                mitigation: highestRiskRule.mitigation_strategy
            };
        }

        return { enforcedAction: 'PASS', mitigation: 'NONE' };
    }

    private isSeverityExempt(ruleSeverity: string, maxOverride: string): boolean {
        // Convert severity to comparable numeric value (assuming P0 > P1 > P2)
        const map = { 'P0_CRITICAL': 3, 'P1_HIGH': 2, 'P2_MODERATE': 1, 'P3_LOW': 0 };
        return map[ruleSeverity] > map[maxOverride];
    }
}