import { SimulationReport, SimulationParameters, SimulationStatusType } from "../types/simulationTypes";

/**
 * Interpretation result detailing if the simulation outcome meets acceptance criteria.
 */
export interface SimulationInterpretationResult {
    isAcceptable: boolean;
    reasons: string[]; // List of failures or warnings
    scoreClass: 'CRITICAL' | 'WARNING' | 'PASS';
}

/**
 * Analyzes a SimulationReport against the defined SimulationParameters to determine
 * if the proposed change is safe for merging.
 * @param report The final outcome of the simulation run.
 * @param params The configuration parameters used for the acceptance threshold.
 * @returns InterpretationResult indicating safety and failure vectors.
 */
export function interpretSimulationResults(report: SimulationReport, params: SimulationParameters): SimulationInterpretationResult {
    const results: string[] = [];
    let isAcceptable = true;

    if (report.status !== 'SUCCESS') {
        isAcceptable = false;
        results.push(`Simulation failed with terminal status: ${report.status}. Failure vector: ${report.failureVector}`);
    }

    // 1. Check Pass Rate
    if (report.metrics.passRate < params.requiredPassRate) {
        isAcceptable = false;
        results.push(`Test pass rate (${(report.metrics.passRate * 100).toFixed(2)}%) fell below the required threshold (${(params.requiredPassRate * 100).toFixed(2)}%).`);
    }

    // 2. Check Performance Delta
    // Performance slowdown ratio is 1 + delta (e.g., 1 + 0.05 = 1.05)
    const maxAcceptableDeltaRatio = 1 + params.targetLatencyDelta;
    if (report.metrics.performanceDelta > maxAcceptableDeltaRatio) {
        isAcceptable = false;
        const slowdown = ((report.metrics.performanceDelta - 1) * 100).toFixed(2);
        const limit = (params.targetLatencyDelta * 100).toFixed(2);
        results.push(`Performance regression detected: ${slowdown}% slowdown (Max allowed: ${limit}%).`);
    }

    // 3. Determine Score Class
    let scoreClass: SimulationInterpretationResult['scoreClass'] = 'PASS';
    if (!isAcceptable) {
        scoreClass = 'CRITICAL';
    } else if (report.simulationScore < 0.7) {
        // Example threshold: Low confidence/score might trigger a warning even if metrics passed.
        scoreClass = 'WARNING';
        results.push('Simulation passed metrics but confidence score is low (< 0.7). Recommend peer review.');
    }

    return {
        isAcceptable,
        reasons: results,
        scoreClass,
    };
}
