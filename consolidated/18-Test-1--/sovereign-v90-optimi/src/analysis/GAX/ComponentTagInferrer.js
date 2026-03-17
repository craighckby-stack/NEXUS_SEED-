/**
 * ComponentTagInferrerKernel
 * v94.1 Sovereign AGI Component for Autonomous Configuration Refinement.
 * MISSION: Analyze component metrics (static/runtime) and suggest optimal Tags
 *          to minimize reliance on manual ComponentProfileMap updates.
 */

class ComponentTagInferrerKernel {
  #staticAnalyzer;
  #telemetryEngine;
  #tagInferenceEngine;
  #tagRules;

  /**
   * @param {object} staticAnalyzer
   * @param {object} telemetryEngine
   * @param {RuleBasedTaggingEngineToolKernel} tagInferenceEngine - Injected reusable tool
   */
  constructor(staticAnalyzer, telemetryEngine, tagInferenceEngine) {
    this.#setupDependencies(staticAnalyzer, telemetryEngine, tagInferenceEngine);
  }

  /**
   * Rigorously validates and assigns all external dependencies and loads internal configuration.
   * @param {object} staticAnalyzer
   * @param {object} telemetryEngine
   * @param {RuleBasedTaggingEngineToolKernel} tagInferenceEngine
   */
  #setupDependencies(staticAnalyzer, telemetryEngine, tagInferenceEngine) {
    if (!staticAnalyzer || typeof staticAnalyzer.analyze !== 'function') {
      throw new Error("Dependency Injection Error: Static Analyzer must be provided and implement 'analyze'.");
    }
    if (!telemetryEngine || typeof telemetryEngine.getRecentData !== 'function') {
      throw new Error("Dependency Injection Error: Telemetry Engine must be provided and implement 'getRecentData'.");
    }
    if (!tagInferenceEngine || typeof tagInferenceEngine.execute !== 'function') {
      throw new Error("Dependency Injection Error: RuleBasedTaggingEngineToolKernel must be provided and implement 'execute'.");
    }

    this.#staticAnalyzer = staticAnalyzer;
    this.#telemetryEngine = telemetryEngine;
    this.#tagInferenceEngine = tagInferenceEngine;
    this.#tagRules = this.#defineInferenceRules(); // Load structured rules for the engine
  }

  /**
   * Defines the structured rules for the RuleBasedTaggingEngineToolKernel.
   * This acts as an internal configuration helper.
   * @returns {Array<Object>}
   */
  #defineInferenceRules() {
    // Structure: { source: 'static'|'runtime', field: string, operator: string, value: any, tag: string }
    return [
      // 1. Static Analysis Inference (e.g., high dependency count suggests criticality)
      {
        source: 'static',
        field: 'dependency_count',
        operator: '>',
        value: 50,
        tag: 'INFRASTRUCTURE_CRITICAL'
      },
      // 2. Runtime/Telemetry Inference (e.g., constant high queue depth suggests high throughput)
      {
        source: 'runtime',
        field: 'queue_depth_avg',
        operator: '>',
        value: 100,
        tag: 'HIGH_THROUGHPUT'
      }
    ];
  }

  /**
   * I/O Proxy: Delegates static analysis calculation to the injected analyzer.
   * @param {string} path
   * @returns {object}
   */
  #delegateToStaticAnalyzerAnalyze(path) {
    return this.#staticAnalyzer.analyze(path);
  }

  /**
   * I/O Proxy: Delegates retrieval of recent runtime telemetry data.
   * @param {string} componentId
   * @returns {object}
   */
  #delegateToTelemetryEngineFetch(componentId) {
    return this.#telemetryEngine.getRecentData(componentId);
  }

  /**
   * I/O Proxy: Executes the rule set against collected data using the dedicated inference tool.
   * @param {object} inputData
   * @returns {Array<string>}
   */
  #delegateToTagInferenceEngineExecute(inputData) {
    return this.#tagInferenceEngine.execute(inputData);
  }

  /**
   * Analyzes component descriptors to infer suggested operational tags.
   * @param {object} componentDescriptor
   * @returns {Array<string>} Suggested tags
   */
  infer(componentDescriptor) {
    const analysis = this.#delegateToStaticAnalyzerAnalyze(componentDescriptor.path);
    const runtimeData = this.#delegateToTelemetryEngineFetch(componentDescriptor.id);

    // Use the external engine to apply all rules simultaneously
    const suggestedTags = this.#delegateToTagInferenceEngineExecute({
      rules: this.#tagRules,
      staticData: analysis,
      runtimeData: runtimeData
    });
    
    return suggestedTags;
  }
}

module.exports = ComponentTagInferrerKernel;