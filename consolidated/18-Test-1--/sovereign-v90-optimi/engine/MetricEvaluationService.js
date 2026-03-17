class MetricEvaluationService {
  #config: Config;
  #metricDefinitions: Record<string, MetricDefinition>;
  #contextMap: any;
  #dataProvider: Map<string, DataProvider>;
  #asyncWeightedScorer: AsyncWeightedScorerInterface;
  #normalizationUtility: NormalizationUtilityInterface;

  constructor(config: Config) {
    this.#initializeEngine(config);
  }

  #initializeEngine(config: Config) {
    this.#config = config;
    this.#metricDefinitions = config.metrics;
    this.#contextMap = config.context_mapping;
    this.#dataProvider = new Map<string, DataProvider>();
    this.#asyncWeightedScorer = {} as AsyncWeightedScorerInterface;
    this.#normalizationUtility = {} as NormalizationUtilityInterface;
  }

  #validateAndSetDataProviders(providers: Record<string, DataProvider>) {
    if (!providers?.NEXUS) {
      throw new Error("MQM Service Initialization Error: NEXUS data provider is required for persistent memory integration.");
    }
    this.#dataProvider = new Map(Object.entries(providers));
  }

  async #delegateToNexusStorage(metricId: string, calculatedValue: number | null): Promise<void> {
    const nexusProvider = this.#dataProvider.get('NEXUS');
    if (nexusProvider?.storeTrend) {
      await nexusProvider.storeTrend({
        metricId,
        value: calculatedValue,
        timestamp: Date.now(),
        source: 'MQM'
      });
    }
  }

  async #delegateToWeightedScorer(components: ComponentDefinition[], dataProviderMap: Map<string, DataProvider>): Promise<CalculationResult> {
    if (typeof this.#asyncWeightedScorer.calculate !== 'function') {
      throw new Error("AsyncWeightedScorer dependency is not injected or initialized.");
    }
    return this.#asyncWeightedScorer.calculate(components, dataProviderMap);
  }

  #delegateToNormalizationUtility(value: number, functionType: string): number {
    if (typeof this.#normalizationUtility.normalize !== 'function') {
      return value;
    }
    return this.#normalizationUtility.normalize(value, functionType);
  }

  async initializeDataProviders(providers: Record<string, DataProvider>) {
    this.#validateAndSetDataProviders(providers);
  }

  async storeMetricResult(metricId: string, calculatedValue: number | null) {
    return this.#delegateToNexusStorage(metricId, calculatedValue);
  }

  /**
   * Calculates a single metric based on its definition and contributing data points.
   * Logs the result to Nexus memory.
   * @param {string} metricId - The identifier of the metric to calculate
   * @returns {Promise<{metricId: string, value: number|null, status: string, type?: string, normalized?: boolean}>}
   */
  async calculateMetric(metricId: string): Promise<{metricId: string, value: number|null, status: string, type?: string, normalized?: boolean}> {
    const definition = this.#metricDefinitions[metricId];
    if (!definition) {
      return { metricId, value: null, status: 'SKIPPED' };
    }

    try {
      const result = await this.#delegateToWeightedScorer(
        definition.calculation_components,
        this.#dataProvider
      );

      if (result.successfulComponents === 0 && result.totalComponents > 0) {
        await this.#delegateToNexusStorage(metricId, null);
        return { metricId, value: null, status: 'FAILED_NO_DATA' };
      }

      let calculatedValue = result.calculatedValue;
      const isNormalized = !!definition.normalization?.function;

      if (isNormalized) {
        calculatedValue = this.#delegateToNormalizationUtility(calculatedValue, definition.normalization.function);
      }

      if (definition.type === 'RISK' && definition.thresholds?.static_max && calculatedValue > definition.thresholds.static_max) {
        console.warn(`RISK METRIC ALERT: ${metricId} exceeded static max threshold.`);
      }

      await this.#delegateToNexusStorage(metricId, calculatedValue);

      return {
        metricId,
        value: calculatedValue,
        status: 'SUCCESS',
        type: definition.type,
        normalized: isNormalized
      };
    } catch (e) {
      if (e instanceof Error && e.message.includes("AsyncWeightedScorer dependency")) {
        console.error(e.message);
        return { metricId, value: null, status: 'CRITICAL_ERROR' };
      }
      throw e;
    }
  }

  /**
   * Calculates all defined metrics and returns a map of results.
   * @returns {Promise<Record<string, {value: number|null, status: string}>>}
   */
  async calculateAllMetrics(): Promise<Record<string, {value: number|null, status: string}>> {
    const results: Record<string, {value: number|null, status: string}> = {};
    const metricIds = Object.keys(this.#metricDefinitions);

    for (const metricId of metricIds) {
      try {
        results[metricId] = await this.calculateMetric(metricId);
      } catch (error) {
        console.error(`Error calculating metric ${metricId}:`, error);
        results[metricId] = { value: null, status: 'CALCULATION_ERROR' };
      }
    }

    return results;
  }
}
