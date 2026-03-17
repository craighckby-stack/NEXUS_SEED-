declare const WeightedScorerUtility: {
  calculate: (metrics: Record<string, number>, weights: Record<string, number>, clamp: boolean) => number;
};

declare const AdaptiveThresholdAdjuster: {
  calculateAdjustment: (baseline: number, environmentalFactor: number, sensitivityMultiplier: number) => number;
};


/**
 * Dynamic Trust Model (DTM) Engine V94.1
 * Responsible for calculating real-time risk scores based on policy metrics.
 */
class DTM_AdaptiveEngine {
  // Static Configuration and Constants (Encapsulated)
  private static readonly #ENTROPY_SENSITIVITY = 0.05;
  private static readonly #DEPTH_NORMALIZER = 100.0; // Assuming depth max is 100
  private static readonly #SCORING_WEIGHTS = Object.freeze({
    historicalConfidence: 0.5,
    structuralDepthContribution: 0.3,
    impactMitigation: 0.2
  });

  // Core Utility Dependencies (Resolved statically for single lookup and strong coupling)
  private static readonly #WeightedScorerUtility = WeightedScorerUtility;
  private static readonly #AdaptiveThresholdAdjuster = AdaptiveThresholdAdjuster;

  private readonly #telemetry: any;

  constructor(telemetryFeed: any) {
    if (!telemetryFeed) {
        throw new Error("[DTM Adaptive Engine] Telemetry feed is required for initialization.");
    }
    this.#telemetry = telemetryFeed;
  }

  /**
   * Fetches rolling average of past successful self-modifications (0.0 to 1.0).
   */
  private #getHistoricalConfidence(): number {
    return this.#telemetry.fetchAvgSuccessRate();
  }

  /**
   * Prepares the specific, normalized, and inverted factors used for DTM scoring.
   */
  private #prepareScoringInputs(payload: { metrics: { depth: number } }): Record<string, number> {
    const historicalConfidence = this.#getHistoricalConfidence();
    const impactPrediction = this.#telemetry.getImpactPrediction(payload);
    
    return {
      // Historical track record (favor stability)
      historicalConfidence: historicalConfidence, 
      
      // Structural complexity mitigation (1 - depth/max_depth). Lower depth = higher score contribution.
      structuralDepthContribution: 1.0 - (payload.metrics.depth / DTM_AdaptiveEngine.#DEPTH_NORMALIZER),
      
      // Impact mitigation (1 - severity). Lower severity = higher score contribution.
      impactMitigation: 1.0 - impactPrediction
    };
  }

  /**
   * Delegates the actual weighted scoring calculation to the external utility.
   */
  private #executeWeightedScoreCalculation(inputs: Record<string, number>): number {
    return DTM_AdaptiveEngine.#WeightedScorerUtility.calculate(
      inputs, 
      DTM_AdaptiveEngine.#SCORING_WEIGHTS, 
      true
    );
  }

  /**
   * Calculates the overall normalized trust score for a proposed modification.
   */
  calculateTrustScore(proposedModificationPayload: { metrics: { depth: number } }): number {
    const inputs = this.#prepareScoringInputs(proposedModificationPayload);

    // Delegate the prepared data to the core utility
    return this.#executeWeightedScoreCalculation(inputs);
  }

  /**
   * Retrieves the current environmental context necessary for adaptive adjustments (entropy factor).
   */
  private #getEntropyContext(): number {
    return this.#telemetry.getEnvironmentalEntropy();
  }

  /**
   * Calculates the minimum required trust, adjusting upward based on system entropy.
   */
  MinTrustRequired(baseline: number): number {
    const entropyFactor = this.#getEntropyContext();
    
    // Use the statically resolved utility and static sensitivity.
    return DTM_AdaptiveEngine.#AdaptiveThresholdAdjuster.calculateAdjustment(
      baseline, 
      entropyFactor, 
      DTM_AdaptiveEngine.#ENTROPY_SENSITIVITY
    );
  }
}

export default DTM_AdaptiveEngine;