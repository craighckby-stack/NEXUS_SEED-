/**
 * AGI-KERNEL Policy: HARM Mitigation Kernel v1.2
 * Enforces policy based on detected harm scores, utilizing rigorous architectural separation.
 */

// --- External Interfaces ---
interface PolicyRule {
    category: string;
    threshold: number;
    severity: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MODERATE' | 'P3_LOW';
    action: string;
    mitigation_strategy: string;
}

interface ContextualExemption {
    context_tag: string;
    max_severity_override: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MODERATE' | 'P3_LOW';
}

interface HarmPolicyConfig {
    default_action: string;
    rules: PolicyRule[];
    contextual_exemptions: ContextualExemption[];
}

type DetectionScores = { [category: string]: number };

interface PolicyResult {
    enforcedAction: string;
    mitigation: string;
}

export class HarmMitigationKernel {
    // --- Constants ---
    private readonly #SEVERITY_LEVELS: Record<PolicyRule['severity'], number> = {
        'P0_CRITICAL': 3,
        'P1_HIGH': 2,
        'P2_MODERATE': 1,
        'P3_LOW': 0
    };

    // --- State ---
    private #policyConfig: HarmPolicyConfig;
    private #isInitialized = false;

    constructor(policyConfigPath: string = 'config/HARM.json') {
        this.#initializeKernel(policyConfigPath);
    }

    /**
     * Initializes the HARM Mitigation Kernel with configuration.
     * @param policyConfigPath Path to the policy configuration file
     */
    #initializeKernel(policyConfigPath: string): void {
        try {
            this.#policyConfig = this.#loadAndValidateConfig(policyConfigPath);
            this.#isInitialized = true;
        } catch (error) {
            this.#logError("HARM Mitigation Kernel failed to load configuration", error);
            // Fail-safe initialization
            this.#policyConfig = { default_action: "BLOCK", rules: [], contextual_exemptions: [] };
        }
    }

    /**
     * Loads and validates the policy configuration.
     * @param policyConfigPath Path to the configuration file
     * @returns Validated policy configuration
     * @throws Error if configuration loading or validation fails
     */
    #loadAndValidateConfig(policyConfigPath: string): HarmPolicyConfig {
        try {
            const config = require(policyConfigPath);
            
            if (!config.rules || !Array.isArray(config.rules)) {
                throw new Error("Policy configuration is missing the 'rules' array.");
            }
            
            return config;
        } catch (error) {
            throw new Error(`Failed to load configuration from ${policyConfigPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Analyzes input based on scores and executes mandated policy actions.
     * @param detectionScores Object mapping category to detected harm score (0.0 to 1.0)
     * @param contextTags Optional context tags that might override policy rules
     * @returns The enforced action and the chosen mitigation strategy
     */
    async enforcePolicy(detectionScores: DetectionScores, contextTags: string[] = []): Promise<PolicyResult> {
        if (!this.#isInitialized) {
            this.#logWarning("HARM Kernel uninitialized. Returning default action.");
            return { enforcedAction: this.#policyConfig.default_action, mitigation: 'LOG' };
        }

        const highestRiskViolation = this.#findHighestRiskViolation(detectionScores);

        if (highestRiskViolation) {
            const isExempt = this.#isExempt(highestRiskViolation, contextTags);

            if (isExempt) {
                this.#logPolicyBypass(highestRiskViolation.rule.category, highestRiskViolation.score);
                return { enforcedAction: 'PASS_WITH_LOG', mitigation: highestRiskViolation.rule.mitigation_strategy };
            }

            return {
                enforcedAction: highestRiskViolation.rule.action,
                mitigation: highestRiskViolation.rule.mitigation_strategy
            };
        }

        return { enforcedAction: 'PASS', mitigation: 'NONE' };
    }

    /**
     * Finds the highest risk violation from the detection scores.
     * @param detectionScores Object mapping category to detected harm score
     * @returns The highest risk violation or null if no violation found
     */
    #findHighestRiskViolation(detectionScores: DetectionScores): { rule: PolicyRule, score: number } | null {
        let highestRisk: { rule: PolicyRule, score: number } | null = null;

        for (const rule of this.#policyConfig.rules) {
            const score = detectionScores[rule.category] ?? 0.0;

            if (score >= rule.threshold && (!highestRisk || score > highestRisk.score)) {
                highestRisk = { rule, score };
            }
        }

        return highestRisk;
    }

    /**
     * Checks if a violation is exempt based on context tags.
     * @param violation The detected policy violation
     * @param contextTags Context tags that might provide exemption
     * @returns True if the violation is exempt
     */
    #isExempt(violation: { rule: PolicyRule, score: number }, contextTags: string[]): boolean {
        if (contextTags.length === 0 || this.#policyConfig.contextual_exemptions.length === 0) {
            return false;
        }

        return contextTags.some(tag =>
            this.#policyConfig.contextual_exemptions
                .filter(ex => ex.context_tag === tag)
                .some(ex => this.#isSeverityExempt(violation.rule.severity, ex.max_severity_override))
        );
    }

    /**
     * Determines if a rule severity is exempt based on the maximum allowed override severity.
     * @param ruleSeverity The severity of the violated rule
     * @param maxOverrideSeverity The maximum allowed severity for exemption
     * @returns True if the rule severity is exempt
     */
    #isSeverityExempt(ruleSeverity: PolicyRule['severity'], maxOverrideSeverity: ContextualExemption['max_severity_override']): boolean {
        const ruleLevel = this.#SEVERITY_LEVELS[ruleSeverity];
        const overrideLevel = this.#SEVERITY_LEVELS[maxOverrideSeverity];

        return ruleLevel <= overrideLevel;
    }

    /**
     * Logs a policy bypass event.
     * @param category The category of the bypassed rule
     * @param score The score that triggered the rule
     */
    #logPolicyBypass(category: string, score: number): void {
        console.log(`HARM policy bypassed for context: ${category} score ${score}`);
    }

    /**
     * Logs an error message.
     * @param message The error message
     * @param error The error object
     */
    #logError(message: string, error: unknown): void {
        console.error(message, error instanceof Error ? error.message : String(error));
    }

    /**
     * Logs a warning message.
     * @param message The warning message
     */
    #logWarning(message: string): void {
        console.warn(message);
    }
}
