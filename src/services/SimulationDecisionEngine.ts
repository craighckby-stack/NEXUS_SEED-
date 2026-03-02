import { SimulationReport, SimulationParameters, SimulationStatusType } from '../types/simulationTypes';

export type DecisionOutcome = 'GO' | 'NOGO' | 'REVIEW';

/**
 * Determines the final GO/NOGO/REVIEW decision based on simulation output and required parameters.
 * This abstracts the core policy logic of Sovereign AGI v94.1 and prevents the ATM consumer from duplicating policy checks.
 */
export function analyzeSimulationDecision(report: SimulationReport): { decision: DecisionOutcome, rationale: string[] } {
    const { parameters, metrics, status } = report;
    const rationale: string[] = [];
    let decision: DecisionOutcome = 'GO';

    if (status !== 'SUCCESS') {
        rationale.push(`Simulation failed with terminal status: ${status}.`);
        return { decision: 'NOGO', rationale };
    }

    // 1. Pass Rate Check
    if (metrics.passRateRatio < parameters.requiredPassRate) {
        decision = 'NOGO';
        rationale.push(`Pass rate failed: ${metrics.passRateRatio.toFixed(3)} is below required ${parameters.requiredPassRate.toFixed(3)}.`);
    }

    // 2. Latency Budget Check (Delta is calculated as Post / Initial ratio in the metrics)
    if (metrics.latencyIncreaseRatio > (1.0 + parameters.targetLatencyDelta)) {
        if (decision === 'GO') { decision = 'NOGO'; }
        rationale.push(`Latency budget exceeded: Ratio ${metrics.latencyIncreaseRatio.toFixed(2)} exceeds allowed threshold (1 + ${parameters.targetLatencyDelta}).`);
    }

    // 3. Resource Saturation Check (Soft limit, triggers REVIEW)
    if (metrics.resourceSaturationRatio >= 0.95 && decision === 'GO') {
        decision = 'REVIEW';
        rationale.push(`High resource ceiling proximity detected (${metrics.resourceSaturationRatio.toFixed(2)}). Requires manual review for potential deployment risk.`);
    }
    
    // 4. Certainty Score Check (Risk assessment)
    if (report.certaintyScore < 0.7 && decision === 'GO') {
        decision = 'REVIEW';
        rationale.push(`Low certainty score (${report.certaintyScore.toFixed(2)}). Deployment confidence is below 70%.`);
    }

    if (decision === 'GO') {
         rationale.push('All critical deployment parameters met or exceeded requirements.');
    }


    return { decision, rationale };
}