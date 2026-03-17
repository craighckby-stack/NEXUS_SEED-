declare const ExponentialMovingAveragerTool: {
    update(currentAverage: number, newValue: number, alpha: number): number;
};

// Assuming the existence of a utility tool for clamping/range validation
declare const WeightedScorerUtility: {
    clamp(value: number, min: number, max: number): number;
};

/**
 * Configuration schema for the ContextualRuntimeMonitor.
 */
interface MonitorConfig {
    /** The smoothing factor (alpha) for the Exponential Moving Average calculation (0 < alpha <= 1). */
    latencyAlpha: number;
    /** Weight assigned to normalized latency in risk calculation (0-1). */
    latencyWeight: number;
    /** Weight assigned to external stress in risk calculation (0-1). */
    stressWeight: number;
    /** Weight assigned to telemetry unreliability in risk calculation (0-1). */
    reliabilityWeight: number;
}

/**
 * ContextualRuntimeMonitor assesses operational risk based on calculated metrics
 * and external environmental factors, ensuring maximum computational efficiency
 * and recursive abstraction.
 */
class ContextualRuntimeMonitor {
    private config: MonitorConfig;
    private averageLatencyMs: number;
    private lastTelemetryReliability: number;
    private externalStressFactor: number;

    /**
     * @param config The monitor configuration, including EMA alpha and scoring weights.
     */
    constructor(config: MonitorConfig) {
        if (config.latencyAlpha <= 0 || config.latencyAlpha > 1) {
            throw new Error("Configuration Error: Latency alpha must be between 0 and 1.");
        }
        this.config = config;
        this.averageLatencyMs = 0.0; 
        this.lastTelemetryReliability = 1.0; 
        this.externalStressFactor = 0.0; // Normalized stress factor [0.0, 1.0]
    }

    /**
     * Updates the Exponential Moving Average for operational latency using the dedicated tool.
     * @param newLatency The latest measured latency in milliseconds.
     */
    public recordLatencyMeasurement(newLatency: number): void {
        this.averageLatencyMs = ExponentialMovingAveragerTool.update(
            this.averageLatencyMs,
            newLatency,
            this.config.latencyAlpha
        );
    }

    /**
     * Sets the current assessment of external environmental stress (0.0 to 1.0).
     * @param stress The current normalized stress factor.
     */
    public setExternalStress(stress: number): void {
        this.externalStressFactor = Math.max(0.0, Math.min(1.0, stress));
    }

    /**
     * Sets the reliability of the underlying telemetry reporting system (0.0 to 1.0).
     * @param reliability The reliability factor.
     */
    public setTelemetryReliability(reliability: number): void {
        this.lastTelemetryReliability = Math.max(0.0, Math.min(1.0, reliability));
    }

    /**
     * Computes the Environmental Risk Factor (ERF) based on accumulated metrics.
     * The ERF is always clamped to the valid probability range [0.0, 1.0].
     *
     * @param maxAcceptableLatencyMs The maximum latency threshold for normalization.
     * @returns The calculated environmental risk factor (0.0 to 1.0).
     */
    public calculateEnvironmentalRiskFactor(maxAcceptableLatencyMs: number = 500): number {
        
        // 1. Normalize Average Latency (Higher latency means higher normalized value, max 1.0)
        const normalizedLatency = Math.min(1.0, this.averageLatencyMs / maxAcceptableLatencyMs);
        
        // 2. Derive Telemetry Risk (Unreliability)
        // Reliability of 1.0 -> Risk of 0.0. Reliability of 0.0 -> Risk of 1.0.
        const telemetryRisk = 1.0 - this.lastTelemetryReliability;

        // 3. Calculate Weighted Sum
        const weights = this.config;
        
        const riskScore = (weights.latencyWeight * normalizedLatency) +
                          (weights.stressWeight * this.externalStressFactor) +
                          (weights.reliabilityWeight * telemetryRisk);
        
        // 4. Clamping: Ensure range [0.0, 1.0].
        if (typeof WeightedScorerUtility !== 'undefined' && WeightedScorerUtility.clamp) {
            return WeightedScorerUtility.clamp(riskScore, 0.0, 1.0);
        } else {
            // Fallback for structural integrity
            return Math.max(0.0, Math.min(1.0, riskScore));
        }
    }

    public getCurrentAverageLatency(): number {
        return this.averageLatencyMs;
    }
}