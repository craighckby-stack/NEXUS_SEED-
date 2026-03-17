import {
    SimulationParameters,
    SimulationPerformanceMetrics,
    SimulationAuditData,
    SimulationReport,
    SimulationToleranceCheckResult,
    SimulationStatusType,
} from '../types/simulationTypes';

/**
 * Sovereign AGI Utility v94.1: Report Generation
 * Centralized logic for compiling raw simulation results into a standardized, validated SimulationReport.
 * Ensures consistent calculation of derived ratios, tolerances, and terminal status assignment.
 */

interface RawSimulationInput {
    parameters: SimulationParameters;
    // Raw inputs before automated derivation
    metrics: Omit<SimulationPerformanceMetrics, 'achievedPassRateRatio' | 'latencyIncreaseRatio'>;
    auditData: SimulationAuditData;
    riskPredictionConfidenceRatio: number;
    // Null unless a crash or external non-tolerance failure occurred
    externalTerminalStatus: SimulationStatusType | null;
}

// Helper to calculate derived tolerance result
function calculateTolerances(
    params: SimulationParameters,
    metrics: SimulationPerformanceMetrics
): SimulationToleranceCheckResult {
    // Note: Latency Increase Ratio > 1.0 means slowdown. Tolerance is compared against the increase (ratio - 1)
    const maxRatioThreshold = 1 + params.maxAcceptableLatencyIncreaseRatio;
    
    const latencyToleranceMet = metrics.latencyIncreaseRatio <= maxRatioThreshold;
    const passRateToleranceMet = metrics.achievedPassRateRatio >= params.requiredPassRateRatio;

    return {
        latencyToleranceMet,
        passRateToleranceMet,
        overallTolerancesMet: latencyToleranceMet && passRateToleranceMet,
    };
}

// Helper to determine terminal status based on external factors (like system crash) and internal checks
function determineStatus(
    externalStatus: SimulationStatusType | null, 
    tolerances: SimulationToleranceCheckResult
): SimulationStatusType {
    if (externalStatus && externalStatus !== 'FAILURE') {
        // Prioritize system-level failures over tolerance checks
        return externalStatus;
    }

    if (tolerances.overallTolerancesMet) {
        return 'SUCCESS';
    }

    // If tolerances failed, assign the appropriate status
    return 'TOLERANCE_EXCEEDED';
}

export function generateReport(rawInput: RawSimulationInput): SimulationReport {
    // 1. Calculate derived metrics (Ratios)
    const achievedPassRateRatio = rawInput.metrics.totalTestCases > 0 
        ? rawInput.metrics.passedTestCases / rawInput.metrics.totalTestCases
        : 1.0; 

    const latencyIncreaseRatio = rawInput.metrics.baselineLatencyMs > 0
        ? rawInput.metrics.postMutationLatencyMs / rawInput.metrics.baselineLatencyMs
        : 1.0; 

    const derivedMetrics: SimulationPerformanceMetrics = {
        ...rawInput.metrics,
        achievedPassRateRatio,
        latencyIncreaseRatio,
    };

    // 2. Calculate tolerance checks
    const tolerances = calculateTolerances(rawInput.parameters, derivedMetrics);

    // 3. Determine final status
    const status = determineStatus(rawInput.externalTerminalStatus, tolerances);

    // 4. Compile Report
    return {
        parameters: rawInput.parameters,
        riskPredictionConfidenceRatio: rawInput.riskPredictionConfidenceRatio,
        status,
        metrics: derivedMetrics,
        tolerances,
        audit: rawInput.auditData,
    };
}