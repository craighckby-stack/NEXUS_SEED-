import { GFRMSpec } from '../GFRM_spec';
import { ProcessAudit } from '../../interfaces/AuditSchema';

export type ComplianceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ComplianceAction = 'Hard_Shutdown_L5' | 'Escalate_V94' | 'Continue_Optimize' | 'Notify_T3';

export interface ComplianceOutcome {
    compliance: boolean;
    severity: ComplianceSeverity;
    action: ComplianceAction;
    riskScore: number;
    violationDetail?: string;
}

/**
 * Interface defining the requirements for any service evaluating compliance rules.
 * Facilitates dependency injection and swapping rule engines.
 */
export interface IRuleEvaluationService {
    /** Checks for T0 (Absolute) Violations, resulting in immediate failure. */
    checkT0Violations(process: ProcessAudit): Promise<string | null>;

    /** Calculates the T1 Operational Risk Score (0-100). */
    calculateRisk(process: ProcessAudit): Promise<number>;

    /** Dynamically updates the configuration ruleset. */
    updateRuleset(newSpec: GFRMSpec): void;
}