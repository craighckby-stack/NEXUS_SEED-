import { SimulationReport } from '../types/simulationTypes';

export type DecisionOutcome = 'GO' | 'NOGO' | 'REVIEW';

/**
 * Declare the PolicyDecisionEvaluatorTool interface, assumed to be provided by the kernel.
 */
declare const PolicyDecisionEvaluatorTool: {
    execute: (report: SimulationReport) => { decision: DecisionOutcome, rationale: string[] };
};

/**
 * Determines the final GO/NOGO/REVIEW decision based on simulation output and required parameters.
 * This delegates the core policy logic of Sovereign AGI v94.1 to the robust PolicyDecisionEvaluatorTool, 
 * preventing duplication of policy checks.
 */
export function analyzeSimulationDecision(report: SimulationReport): { decision: DecisionOutcome, rationale: string[] } {
    // Delegation to the optimized, verifiable policy tool
    return PolicyDecisionEvaluatorTool.execute(report);
}