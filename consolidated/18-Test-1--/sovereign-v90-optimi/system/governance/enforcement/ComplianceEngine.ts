// GFRM Compliance Engine
// Autonomous enforcement layer for GFRM_spec.json

import { GFRMSpec } from '../GFRM_spec';
import { ProcessAudit } from '../../interfaces/AuditSchema';
import {
    ComplianceAction,
    ComplianceOutcome,
    ComplianceSeverity,
    IRuleEvaluationService
} from './types';
import { RuleEvaluationService } from './RuleEvaluationService';

// --- START: Extracted Tool Logic Integration ---

/**
 * Executes a configuration-driven threshold check.
 * This helper implements the logic of the ConfigurableThresholdChecker plugin
 * (extracted to handle safe configuration navigation and comparison).
 */
function checkConfigurableThreshold(
    config: any,
    score: number,
    configPath: string[],
    defaultThreshold: number,
    comparison: string = '>='
): { violation: boolean, threshold: number } {
    let threshold = defaultThreshold;
    
    try {
        let current = config;
        // Safely traverse the configuration object
        for (const key of configPath) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                current = undefined; // Path broken, use default
                break;
            }
        }
        if (typeof current === 'number' && !isNaN(current)) {
            threshold = current;
        }
    } catch (e) {
        // Error during access, fall back to default
    }

    let violation = false;
    
    // Apply comparison (assuming '>=' based on original requirement)
    if (comparison === '>=') {
        violation = score >= threshold;
    }
    
    return { violation, threshold };
}

// --- END: Extracted Tool Logic Integration ---


/**
 * ComplianceEngine
 * Drives the enforcement process by utilizing the IRuleEvaluationService 
 * to check T0 constraints, calculate T1 risk, and determine compliance outcome.
 */
class ComplianceEngine {
    private ruleset: GFRMSpec;
    private evaluator: IRuleEvaluationService;

    constructor(spec: GFRMSpec, evaluator?: IRuleEvaluationService) {
        this.ruleset = spec;
        // Dependency Injection for testing and modularity, defaulting to concrete implementation
        this.evaluator = evaluator || new RuleEvaluationService(spec);
    }

    /**
     * Audits a running process against GFRM tiers (T0, T1, T2).
     * @param process The audit snapshot of the running process.
     * @returns The determined compliance outcome and required action.
     */
    public async audit(process: ProcessAudit): Promise<ComplianceOutcome> {
        // T0 Check: Absolute, immediate fail constraints.
        const t0Violation = await this.evaluator.checkT0Violations(process);
        if (t0Violation) {
            return this.createOutcome(
                false,
                'CRITICAL',
                'Hard_Shutdown_L5',
                100,
                t0Violation
            );
        }

        // T1 Check: Operational Risk Assessment
        const riskScore = await this.evaluator.calculateRisk(process);

        // ABSTRACTION: Utilize the ConfigurableThresholdChecker logic for T1 evaluation
        const thresholdCheck = checkConfigurableThreshold(
            this.ruleset,
            riskScore,
            ['governance_tiers', 'tier_1_operational_risk', 'risk_tolerance_threshold'],
            50, // Default tolerance set high if config missing (fail-safe)
            '>='
        );

        if (thresholdCheck.violation) {
             return this.createOutcome(
                false,
                'HIGH',
                'Escalate_V94',
                riskScore
             );
        }

        // T2 Check: Continuous Optimization (Default success)
        return this.createOutcome(
            true,
            'LOW',
            'Continue_Optimize',
            riskScore
        );
    }

    /**
     * Internal utility to standardize ComplianceOutcome creation.
     */
    private createOutcome(
        compliance: boolean,
        severity: ComplianceSeverity,
        action: ComplianceAction,
        riskScore: number,
        violationDetail?: string
    ): ComplianceOutcome {
        return { compliance, severity, action, riskScore, violationDetail };
    }

    /**
     * Utility for refreshing the ruleset.
     */
    public updateRuleset(newSpec: GFRMSpec): void {
        this.ruleset = newSpec;
        // Ensure evaluator is updated dynamically without restarting the engine
        this.evaluator.updateRuleset(newSpec);
    }
}

export { ComplianceEngine };
export type { ComplianceAction, ComplianceOutcome, ComplianceSeverity, IRuleEvaluationService };

export default ComplianceEngine;