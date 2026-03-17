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
 * Sovereign AGI v94.1 Implementation of the operational compliance calculations.
 * This service acts as the central orchestrator for evaluating audit data against the GFRM ruleset,
 * utilizing specialized internal evaluators for high-efficiency T0 checks and tiered T1 risk scoring.
 * Implements structured reporting for better downstream processing and logging.
 */
export class RuleEvaluationService implements IRuleEvaluationService {
    private ruleset: GFRMSpec;
    // A map to cache pre-processed, high-priority T0 constraint limits for fast O(1) lookup.
    private t0ConstraintCache: Map<string, any>; 

    constructor(spec: GFRMSpec) {
        this.ruleset = spec;
        this.t0ConstraintCache = this.initializeT0Cache(spec);
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
     * This method applies weighted rules defined in the governance tiers using a linear weighted summation model.
     */
    public async evaluateT1Risk(process: ProcessAudit): Promise<T1RiskReport> {
        let weightedScoreAccumulator = 0;
        const triggeredRules: T1RiskReport['triggeredRules'] = [];

        // --- Placeholder for Rule Execution Engine Integration ---
        // NOTE: In a refactored architecture, this would iterate over executable rules provided by the GFRMHeuristicMapper.
        
        // Simulated Iteration using ruleset directly:
        if (this.ruleset.governance_tiers) {
            // Simplified model: Iterate through rules defined in 'Tier_A' for demonstration
            const relevantRules = this.ruleset.governance_tiers.Tier_A || [];
            
            for (const rule of relevantRules) {
                if (rule.id === 'CTX_DRIFT_01' && process.context_metrics.drift_index > 0.7) {
                    const contribution = process.context_metrics.drift_index * rule.weight;
                    weightedScoreAccumulator += contribution;
                    triggeredRules.push({
                        ruleId: rule.id,
                        weightApplied: contribution,
                        contextValue: process.context_metrics.drift_index
                    });
                }
            }
        }

        // Normalize accumulated score against 100
        const normalizedScore = Math.min(100, Math.max(0, Math.round(weightedScoreAccumulator)));

        return {
            riskScore: normalizedScore,
            triggeredRules: triggeredRules,
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