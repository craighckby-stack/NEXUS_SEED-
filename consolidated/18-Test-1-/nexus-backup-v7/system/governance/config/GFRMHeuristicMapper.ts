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

// CRITICAL: We declare the external dependency on the new plugin's interface.
declare const RuleFunctionRegistryTool: {
    register: (id: string, func: RiskHeuristicFunction) => boolean;
    get: (id: string) => RiskHeuristicFunction | undefined;
};

/**
 * The GFRM Heuristic Mapper is responsible for bridging abstract rule definitions (IDs, Weights)
 * in the GFRMSpec with the concrete, executable AGI risk evaluation logic (RiskHeuristicFunction).
 * This utility abstracts complex business logic away from the RuleEvaluationService, relying on 
 * the RuleFunctionRegistryTool for function mapping storage.
 */
export class GFRMHeuristicMapper {
    // Note: The static heuristicMap is removed, replaced by the plugin interface.

    // Static initialization block for registering core heuristics.
    static {
        // Example 1: Context Drift Evaluation
        RuleFunctionRegistryTool.register('CTX_DRIFT_01', (audit, weight, thresholds) => {
            const index = audit.context_metrics.drift_index;
            // Assumes 'max_drift_index_moderate' is defined in thresholds
            if (index > thresholds.max_drift_index_moderate) {
                const contribution = index * weight;
                return { contribution, triggered: true, context: index };
            }
            return { contribution: 0, triggered: false, context: index };
        });

        // Example 2: External API Latency Anomaly
        RuleFunctionRegistryTool.register('EXEC_LATENCY_02', (audit, weight, thresholds) => {
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
                // Use the tool's getter instead of direct map access
                const func = RuleFunctionRegistryTool.get(rule.id);
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