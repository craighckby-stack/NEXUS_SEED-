import { GFRMSpec } from '../GFRM_spec';
import { ProcessAudit } from '../../interfaces/AuditSchema';
import { IRuleEvaluationService } from './types';

/**
 * Defines the structured report for T0 violations (immediate failure conditions).
 */
export type T0ViolationReport = {
    isViolated: boolean;
    details: Array<{ ruleId: string; severity: 'CRITICAL'; message: string; evidence: any }>;
};

/**
 * Defines the structured report for T1 Risk evaluation.
 */
export type T1RiskReport = {
    riskScore: number; // 0-100
    triggeredRules: Array<{ ruleId: string; weightApplied: number; contextValue: any }>;
    analysisTimestamp: number;
};

/**
 * Defines the required interface for the external T1 Risk Scorer utility.
 * This abstracts the complex, weighted calculation logic and ensures dependency injection is type-safe.
 */
interface IWeightedRiskScorer {
    execute(input: {
        // Assuming Tier_A is an array of rule definitions
        rules: GFRMSpec['governance_tiers']['Tier_A'];
        processData: ProcessAudit
    }): {
        riskScore: number;
        triggeredRules: T1RiskReport['triggeredRules'];
    };
}

/**
 * Sovereign AGI v94.1 Implementation of the operational compliance calculations.
 * This service acts as the central orchestrator for evaluating audit data against the GFRM ruleset,
 * utilizing specialized internal evaluators for high-efficiency T0 checks and tiered T1 risk scoring.
 * It requires injection of the IWeightedRiskScorer implementation for T1 calculations.
 * Implements structured reporting for better downstream processing and logging.
 */
export class RuleEvaluationService implements IRuleEvaluationService {
    private ruleset: GFRMSpec;
    // A map to cache pre-processed, high-priority T0 constraint limits for fast O(1) lookup.
    private t0ConstraintCache: Map<string, any>; 
    private t1Scorer: IWeightedRiskScorer; // Stored dependency

    constructor(spec: GFRMSpec, t1Scorer: IWeightedRiskScorer) {
        this.ruleset = spec;
        this.t0ConstraintCache = this.initializeT0Cache(spec);
        this.t1Scorer = t1Scorer; // Inject and store the T1 risk scorer implementation
    }

    /**
     * Initializes a fast lookup cache for T0 constraints, critical for real-time enforcement.
     * @param spec The Governance Framework Rule Model Specification.
     */
    private initializeT0Cache(spec: GFRMSpec): Map<string, any> {
        const cache = new Map<string, any>();
        // Deserialize/compile the T0 policy into a binary state for minimal execution latency.
        if (spec.t0_limits) {
            Object.entries(spec.t0_limits).forEach(([key, value]) => {
                cache.set(key, value);
            });
        }
        return cache;
    }

    /**
     * T0 Evaluation: Checks for absolute, hard-coded constraints using the optimized cache.
     * T0 checks must be deterministic and executed with minimal overhead.
     * @returns A structured report detailing critical violations.
     */
    public async checkT0Violations(process: ProcessAudit): Promise<T0ViolationReport> {
        const violations: T0ViolationReport['details'] = [];
        
        // 1. System Integrity Check (e.g., hash mismatch, unauthorized modification)
        if (process.integrity_check.isCompromised) { 
             violations.push({
                 ruleId: "T0_SYS_1001",
                 severity: 'CRITICAL',
                 message: "Core system integrity flag tripped.",
                 evidence: process.integrity_check
             });
        }

        // 2. Resource Exhaustion Check (utilizing fast cache lookup)
        const memoryLimit = this.t0ConstraintCache.get('max_allocated_memory_bytes');
        if (memoryLimit && process.resource_usage.memory > memoryLimit) {
            violations.push({
                ruleId: "T0_RES_2003",
                severity: 'CRITICAL',
                message: `Exceeded memory allocation limit: ${memoryLimit} bytes.`,
                evidence: process.resource_usage
            });
        }
        
        return {
            isViolated: violations.length > 0,
            details: violations
        };
    }

    /**
     * T1 Evaluation: Calculates a quantitative operational risk score (0-100) and the drivers.
     * This method applies weighted rules defined in the governance tiers using the injected IWeightedRiskScorer.
     */
    public async evaluateT1Risk(process: ProcessAudit): Promise<T1RiskReport> {
        const relevantRules = this.ruleset.governance_tiers?.Tier_A || [];

        // Execute the weighted risk calculation using the injected dependency.
        const results = this.t1Scorer.execute({
            rules: relevantRules,
            processData: process
        });

        return {
            riskScore: results.riskScore,
            triggeredRules: results.triggeredRules,
            analysisTimestamp: Date.now()
        };
    }

    /**
     * Updates the active ruleset and recalculates the fast-access constraint cache.
     * @param newSpec The new Governance Framework Rule Model Specification.
     */
    public updateRuleset(newSpec: GFRMSpec): void {
        this.ruleset = newSpec;
        this.t0ConstraintCache = this.initializeT0Cache(newSpec);
    }
}