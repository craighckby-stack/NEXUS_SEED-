interface StructuralCostRules {
  model_id: string;
  version: string;
  global_policy: {
    violation_threshold: number;
    aggregation_method: 'WEIGHTED_SUM' | 'MAX_VIOLATION';
    evaluation_mode: 'AGGREGATE_ONLY' | 'AGGREGATE_OR_FAILURE';
  };
  metrics: Array<{
    metric_id: string;
    weight: number;
    priority: string;
    is_active?: boolean;
    limit: { type: string; value: number; unit: string };
  }>;
}

interface EvaluationInput {
  baseline: Record<string, number>;
  proposal: Record<string, number>;
}

interface EvaluationReport {
  total_structural_cost: number;
  threshold_violation: boolean;
  rejection_reason?: string;
}

/**
 * CostRuleEngine:
 * Executes the structural cost evaluation based on the governance rules
 * (defined in config/governance/C-01_StructuralCostRules.json) against code analysis deltas.
 */
export class CostRuleEngine {
  private rules: StructuralCostRules;

  constructor(rules: StructuralCostRules) {
    this.rules = rules;
  }

  /**
   * Calculates the resulting cost score and determines policy violation.
   * @param input Contains baseline and proposal metric values for comparison.
   */
  public evaluate(input: EvaluationInput): EvaluationReport {
    const WEIGHT_SCALE = 1000; // Scaling factor for measurable structural cost
    let totalCost = 0;
    let violatedP1 = false;
    let rejectionDetails: string[] = [];

    for (const metricRule of this.rules.metrics) {
      if (metricRule.is_active === false) continue;

      const proposalValue = input.proposal[metricRule.metric_id] || 0;
      const baselineValue = input.baseline[metricRule.metric_id] || 0;
      let violationTriggered = false;
      let excessCost = 0;

      // Calculate cost based on limit type and determine violation
      if (metricRule.limit.type === 'ABSOLUTE_MAX') {
        if (proposalValue > metricRule.limit.value) {
          // Excess cost is the weighted amount above the absolute limit.
          excessCost = (proposalValue - metricRule.limit.value) * metricRule.weight * WEIGHT_SCALE;
          violationTriggered = true;
        }
      } else if (metricRule.limit.type === 'RELATIVE_MAX_CHANGE' && baselineValue > 0) {
        const changeRatio = (proposalValue - baselineValue) / baselineValue;
        if (changeRatio > metricRule.limit.value) {
          // Excess cost is the weighted amount based on exceeding the relative change ratio.
          excessCost = (changeRatio - metricRule.limit.value) * metricRule.weight * WEIGHT_SCALE;
          violationTriggered = true;
        }
      }
      
      if (violationTriggered) {
        rejectionDetails.push(`Metric ${metricRule.metric_id} failed limit check.`);
        if (metricRule.priority === 'P1') {
          violatedP1 = true;
        }
      }

      // Aggregate excess cost (using WEIGHTED_SUM approach to satisfy core interface requirements)
      if (this.rules.global_policy.aggregation_method === 'WEIGHTED_SUM') {
        totalCost += excessCost;
      } // MAX_VIOLATION aggregation logic would be implemented here if needed.
    }

    let thresholdViolation = totalCost > this.rules.global_policy.violation_threshold;
    let rejectionReason: string | undefined = undefined;

    if (thresholdViolation) {
      rejectionReason = `Aggregated structural cost (${totalCost.toFixed(2)}) exceeds threshold (${this.rules.global_policy.violation_threshold}).`;
    }

    // Mandatory evaluation mode check (AGGREGATE_OR_FAILURE)
    if (this.rules.global_policy.evaluation_mode === 'AGGREGATE_OR_FAILURE' && violatedP1) {
      thresholdViolation = true;
      rejectionReason = rejectionReason || `Mandatory P1 failure detected: ${rejectionDetails.filter(r => r.includes('failed')).join('; ')}.`;
    }

    return {
      total_structural_cost: totalCost,
      threshold_violation: thresholdViolation,
      rejection_reason: thresholdViolation ? rejectionReason : undefined
    };
  }
}