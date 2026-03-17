import { GFRMSpec } from '../GFRM_spec';
import { ProcessAudit } from '../../interfaces/AuditSchema';

/**
 * Defines a specialized function capable of evaluating a specific T1 risk heuristic.
 */
export type RiskHeuristicFunction = (
    audit: ProcessAudit, 
    ruleWeight: number, 
    thresholds: GFRMSpec['t1_thresholds']
) => { contribution: number, triggered: boolean, context: any };

/**
 * The GFRM Heuristic Mapper is responsible for bridging abstract rule definitions (IDs, Weights)
 * in the GFRMSpec with the concrete, executable AGI risk evaluation logic (RiskHeuristicFunction).
 * This utility abstracts complex business logic away from the RuleEvaluationService.
 */
export class GFRMHeuristicMapper {
    // Static map storing the compiled evaluation functions keyed by rule ID.
    private static heuristicMap: Map<string, RiskHeuristicFunction> = new Map();

    // Static initialization block for registering core heuristics.
    static {
        // Example 1: Context Drift Evaluation
        GFRMHeuristicMapper.heuristicMap.set('CTX_DRIFT_01', (audit, weight, thresholds) => {
            const index = audit.context_metrics.drift_index;
            // Assumes 'max_drift_index_moderate' is defined in thresholds
            if (index > thresholds.max_drift_index_moderate) {
                const contribution = index * weight;
                return { contribution, triggered: true, context: index };
            }
            return { contribution: 0, triggered: false, context: index };
        });

        // Example 2: External API Latency Anomaly
        GFRMHeuristicMapper.heuristicMap.set('EXEC_LATENCY_02', (audit, weight, thresholds) => {
            const currentLatency = audit.runtime_metrics.latency_ms;
            if (currentLatency > thresholds.avg_latency_ms * 1.5) {
                // Assign 50% of the rule weight for moderate deviation
                const contribution = 0.5 * weight;
                return { contribution, triggered: true, context: currentLatency };
            }
            return { contribution: 0, triggered: false, context: currentLatency };
        });
    }

    /**
     * Parses the ruleset and provides an executable list of heuristics for T1 risk evaluation.
     * @param spec The GFRMSpec containing governance tiers.
     * @returns An array of executable rules defined by the spec.
     */
    public static mapSpecToExecutableRules(spec: GFRMSpec): Array<{ ruleId: string; func: RiskHeuristicFunction; weight: number }> {
        const executableRules = [];

        // Iterate over all tiers defined in the spec
        for (const tierRules of Object.values(spec.governance_tiers)) {
            for (const rule of tierRules) {
                const func = GFRMHeuristicMapper.heuristicMap.get(rule.id);
                if (func) {
                    executableRules.push({
                        ruleId: rule.id,
                        func: func,
                        weight: rule.weight
                    });
                } else {
                    // Critical warning for unmapped rules
                    console.warn(`[GFRM Mapper] Missing concrete heuristic implementation for rule ID: ${rule.id}`);
                }
            }
        }
        return executableRules;
    }
}