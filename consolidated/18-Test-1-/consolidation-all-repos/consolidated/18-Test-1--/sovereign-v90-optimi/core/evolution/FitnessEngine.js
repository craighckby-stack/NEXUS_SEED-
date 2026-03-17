// Implementation of the ACE Fitness Evaluation Engine for AGI-KERNEL v7.4.4 (Updated).
// This engine drives Maturity Progression and Capability Self-Assessment.

/**
 * Interface definition for the required SafeFormulaEvaluator plugin.
 */
interface SafeFormulaEvaluatorPlugin {
    evaluate: (formula: string, context: Record<string, number>) => number;
    sanitize: (formula: string) => string;
}

/**
 * Interface definition for the required DeclarativeConditionEvaluatorTool plugin.
 */
interface DeclarativeConditionEvaluatorToolPlugin {
    checkCondition: (metricValue: number, condition: string, targetValue: number) => boolean;
}

// File-private helper functions for defining static constants (synchronous data preparation)

/**
 * @private
 * Synchronously defines and deep-freezes the internal capability weights.
 */
const _defineCapabilityWeights = () => Object.freeze({
    // Maps Internal Core Scores to AGI Core Capabilities (Navigation, Logic, Memory)
    navigation: Object.freeze({ Autonomy: 0.45, Creativity: 0.35, "Meta-Reasoning": 0.20 }),
    logic: Object.freeze({ "Meta-Reasoning": 0.60, "Error Handling": 0.40 }),
    memory: Object.freeze({ "Error Handling": 0.50, "JSON Parsing": 0.50 })
});

/**
 * @private
 * Synchronously defines and freezes the improvement distribution weights.
 */
const _defineImprovementDistributionWeights = () => Object.freeze({
    // Total sums to 1.0. Prioritizes Meta-Reasoning and Autonomy/Error Handling.
    "Error Handling": 0.20,
    "JSON Parsing": 0.10,
    "Meta-Reasoning": 0.30,
    "Autonomy": 0.25,
    "Creativity": 0.15
});

/**
 * @class FitnessEngine
 * Consumes config/metrics_and_oracles_v2.json and calculates the fitness score
 * for a new codebase generation based on collected runtime and static metrics.
 *
 * Crucial for the kernel's Meta-Reasoning and Self-Improvement cycle, now integrating Historical Context.
 */
class FitnessEngine {
  
  // Define internal weights structure using extracted setup functions
  static CAPABILITY_WEIGHTS = _defineCapabilityWeights();
  static IMPROVEMENT_DISTRIBUTION_WEIGHTS = _defineImprovementDistributionWeights();
    
  // Formalized constants for system tuning and clarity (Logic/Error Handling)
  static MAX_FITNESS = 10.0;
  static EPSILON = 1e-9; 
  static HISTORICAL_IMPROVEMENT_THRESHOLD = 0.05; // 5% relative change needed for adjustment
  static HISTORICAL_MAX_ADJUSTMENT = 0.30; // Max 30% boost/penalty
  static HISTORICAL_PENALTY_RATIO = 0.5; // Regression penalty is 50% of the reward magnitude
  // NEW: Constants for robust historical comparison when metrics are near zero (Logic/Memory)
  static MIN_ABSOLUTE_HISTORY = 1e-4; // Minimum non-zero denominator for relative change stability
  static ABSOLUTE_CHANGE_THRESHOLD = 0.5; // Absolute change required if baseline is near zero
  static MAX_FORMULA_LENGTH = 512; 

  // Private encapsulated state and dependencies
  #config: any;
  #isOperational: boolean;
  #formulaEvaluator: SafeFormulaEvaluatorPlugin;
  #conditionEvaluator: DeclarativeConditionEvaluatorToolPlugin;

  constructor(
    metricsConfig: any,
    formulaEvaluator: SafeFormulaEvaluatorPlugin,
    conditionEvaluator: DeclarativeConditionEvaluatorToolPlugin
  ) {
    this.#setupDependencies(formulaEvaluator, conditionEvaluator);
    this.#initializeConfiguration(metricsConfig);
  }

  /**
   * Private helper to encapsulate dependency assignment.
   * @param {SafeFormulaEvaluatorPlugin} formulaEvaluator
   * @param {DeclarativeConditionEvaluatorToolPlugin} conditionEvaluator
   */
  #setupDependencies(
    formulaEvaluator: SafeFormulaEvaluatorPlugin,
    conditionEvaluator: DeclarativeConditionEvaluatorToolPlugin
  ) {
    this.#formulaEvaluator = formulaEvaluator;
    this.#conditionEvaluator = conditionEvaluator;
  }

  /**
   * Private helper to handle synchronous configuration validation and setup.
   * Separates complex setup boilerplate from the constructor core.
   * @param {any} metricsConfig
   */
  #initializeConfiguration(metricsConfig: any) {
      if (!metricsConfig || !metricsConfig.profiles || typeof metricsConfig.profiles !== 'object') {
          // Robust data extraction/JSON Parsing check
          console.error("FitnessEngine: Invalid or missing metrics configuration provided. Profiles object missing.");
          this.#config = { profiles: {} };
          this.#isOperational = false;
          return;
      } 

      this.#config = metricsConfig;
      this.#isOperational = true;
      
      // JSON Parsing: Deep structural validation check for profiles
      for (const profileName in this.#config.profiles) {
          const profile = this.#config.profiles[profileName];
          if (typeof profile !== 'object' || 
              !profile.target_metric || 
              !profile.optimization_goal ||
              !['minimize', 'maximize', 'neutral'].includes(profile.optimization_goal)) {
              console.error(`FitnessEngine: Profile '${profileName}' failed structural validation (Missing target_metric or invalid optimization_goal).`);
              this.#isOperational = false;
              break;
          }
          
          // NEW: Robust Oracle Structure Check (Error Handling/JSON Parsing)
          if (profile.oracles && !Array.isArray(profile.oracles)) {
              console.error(`FitnessEngine: Profile '${profileName}' oracles property must be an array, found type ${typeof profile.oracles}.`);
              this.#isOperational = false;
              break;
          }
      }
  }

  /**
   * Internal utility to safely retrieve and validate a metric value.
   * Enforced private method (#) for robust encapsulation (Error Handling).
   *
   * @param {Object} rawMetrics - Collected M_* metrics.
   * @param {string} metricKey - The key to look up.
   * @returns {number} The safe numeric metric value.
   */
  #safeGetMetricValue(rawMetrics: Record<string, any>, metricKey: string): number {
      const exists = rawMetrics && rawMetrics.hasOwnProperty(metricKey);
      
      if (!exists) {
          // NEW IMPROVEMENT (Error Handling): Log when a referenced metric is entirely missing, indicating a data collection failure.
          console.warn(`FitnessEngine: Metric '${metricKey}' is entirely missing from rawMetrics. Using 0.0.`);
          return 0.0;
      }
      
      const value = rawMetrics[metricKey];

      // Explicitly check for null/undefined/non-number or non-finite numbers
      if (typeof value !== 'number' || !isFinite(value)) {
          // Enhanced logging for specific failure (Error Handling/Meta-Reasoning)
          console.warn(`FitnessEngine: Metric '${metricKey}' found but is unsafe/non-finite (${value}). Using 0.0.`);
          return 0.0;
      }
      return value;
  }
  
  /**
   * I/O Proxy: Delegates evaluation request to the SafeFormulaEvaluator plugin.
   * Enforces strict separation of external dependency interaction.
   */
  #delegateToFormulaEvaluator(formula: string, context: Record<string, any>): number {
      return this.#formulaEvaluator.evaluate(formula, context as Record<string, number>);
  }

  /**
   * Autonomy/Security: Evaluates a dynamic metric formula using the SafeFormulaEvaluator plugin.
   * 
   * @param {Record<string, number>} rawMetrics - Collected M_* metrics.
   * @param {string} formulaString - The metric ID or dynamic calculation string.
   * @returns {number} The calculated metric value, or 0.0 on error.
   */
  calculateDerivedMetric(rawMetrics: Record<string, any>, formulaString: string): number {
    if (!formulaString) return 0.0;

    // 1. Check if the formula is just a direct key lookup (optimization)
    if (!formulaString.match(/[+\-\*()/]/)) {
        return this.#safeGetMetricValue(rawMetrics, formulaString);
    }

    // 2. Delegate to I/O Proxy for external evaluation (Autonomy/Logic)
    return this.#delegateToFormulaEvaluator(formulaString, rawMetrics);
  }
  
  /**
   * Calculates fitness based on raw metric data, history, and the specified profile.
   * Aligns with the Error Handling and Meta-Reasoning core capabilities.
   *
   * @param {Object} rawMetrics - Collected M_* metrics (e.g., M_ERROR_RATE, M_COMPLEXITY).
   * @param {string} profileName - E.g., 'P_PRODUCTION_STABILITY'.
   * @param {Object} [historicalMetrics={}] - Historical metrics (e.g., previous cycle averages from Nexus).
   * @returns {number} Calculated fitness score (0.0 to MAX_FITNESS).
   */
  calculate(rawMetrics: Record<string, any>, profileName: string, historicalMetrics: Record<string, any> = {}): number {
    
    // Robust Error Handling: Ensure rawMetrics is usable
    if (typeof rawMetrics !== 'object' || rawMetrics === null) {
        console.warn(`FitnessEngine: Invalid rawMetrics provided. Returning baseline score 0.`);
        return 0.0;
    }
    
    if (!this.#isOperational) {
        console.warn(`FitnessEngine: Configuration is not operational. Returning baseline score 0.`);
        return 0.0;
    }

    // [... Calculation logic would continue here ...]
  }
}