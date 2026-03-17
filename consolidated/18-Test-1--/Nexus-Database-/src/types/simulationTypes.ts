/**
 * Simulation Configuration and Reporting Types
 * Used by PreCommitSimulationRunner (PSR) and consumed by Automated Terminal Manager (ATM).
 * Sovereign AGI v94.1 Refactoring Rationale: Introduced explicit SimulationToleranceCheckResult for atomic programmatic validation,
 * enhancing efficiency for downstream triage agents and standardized core component grouping.
 */

// --- Core Definitions: Status and Stress Levels ---

export const SIMULATION_PROCESS_STRESS_LEVELS = ['low', 'medium', 'high', 'intensive'] as const;
/** Defines the expected stress load for the simulation run. */
export type SimulationStressLevel = typeof SIMULATION_PROCESS_STRESS_LEVELS[number];

export const SIMULATION_REPORT_STATUSES = ['SUCCESS', 'FAILURE', 'TOLERANCE_EXCEEDED', 'SYSTEM_CRASH', 'ROLLBACK_FAILURE'] as const;
/** Defines the terminal state of the simulation outcome. */
export type SimulationStatusType = typeof SIMULATION_REPORT_STATUSES[number];

// --- Simulation Configuration ---

/**
 * Defines the parameters used to configure a specific simulation run. (Inputs)
 */
export interface SimulationParameters {
    readonly stressLevel: SimulationStressLevel;

    /** Maximum acceptable ratio by which post-mutation latency can exceed baseline (e.g., 0.05 for 5% tolerance). Range: 0.0 to N. */
    readonly maxAcceptableLatencyIncreaseRatio: number;

    /** Minimum acceptable test pass rate ratio (0.0 - 1.0). */
    readonly requiredPassRateRatio: number;
}

// --- Simulation Metrics and Results (Outputs) ---

/**
 * Detailed metrics gathered during the performance assessment phase of the simulation.
 */
export interface SimulationPerformanceMetrics {
    readonly totalTestCases: number;
    readonly passedTestCases: number;
    /** Ratio of Passed/Total (0.0 - 1.0) */
    readonly achievedPassRateRatio: number;

    /** Baseline performance value (e.g., total execution time in ms). */
    readonly baselineLatencyMs: number;
    /** Performance value after applying changes. */
    readonly postMutationLatencyMs: number;
    /** Ratio of Post / Baseline Latency (e.g., 1.1 means 10% slowdown; 0.9 means 10% improvement). */
    readonly latencyIncreaseRatio: number;

    /** Normalized measure of resource usage relative to configured limits (0.0 = low use, 1.0 = ceiling hit). */
    readonly resourceSaturationRatio: number;
}

/**
 * Result of comparing achieved metrics against configured parameters.
 * Provides atomic boolean flags for immediate programmatic validation by the Triage Engine.
 */
export interface SimulationToleranceCheckResult {
    /** True if latency increase ratio was within `maxAcceptableLatencyIncreaseRatio`. */
    readonly latencyToleranceMet: boolean;
    /** True if achieved pass rate ratio was greater than or equal to `requiredPassRateRatio`. */
    readonly passRateToleranceMet: boolean;
    /** True if all defined tolerances were met, regardless of system state (crash). */
    readonly overallTolerancesMet: boolean;
}

/**
 * Contains immutable metadata necessary for tracking, debugging, and compliance.
 */
export interface SimulationAuditData {
    /** Unique identifier for this specific simulation execution. */
    readonly simulationId: string;
    /** The timestamp when the simulation run completed (milliseconds since epoch). */
    readonly runTimestampMs: number;
    /** The version of the Sovereign AGI that generated the change set and ran the simulation. */
    readonly agentVersion: string;
    /** Detailed reason for failure, exception stack, or simulation crash vector. Null if status is SUCCESS. */
    readonly failureVector: string | null;
}

/**
 * The definitive report summarizing the outcome of a pre-commit simulation run.
 */
export interface SimulationReport {
    /** The specific configuration used for this simulation run. Critical for auditability. */
    readonly parameters: SimulationParameters;

    /** Ratio indicating the model's prediction confidence regarding the systemic stability of the mutation (0.0 = uncertain/high risk, 1.0 = certain/low risk). */
    readonly riskPredictionConfidenceRatio: number;

    readonly status: SimulationStatusType;

    readonly metrics: SimulationPerformanceMetrics;

    /** Explicit determination of whether the performance targets were achieved. */
    readonly tolerances: SimulationToleranceCheckResult;

    /** Grouping of mandatory tracing and debugging metadata. */
    readonly audit: SimulationAuditData;
}