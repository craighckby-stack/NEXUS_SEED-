/**
 * Interface for granular performance or resource usage metrics.
 */
export interface IGovernanceMetric {
    id: string;
    value: number;
    baseCost: number;
    // Contextual tag for recursive abstraction purposes
    category: string; 
}

/**
 * Interface for cost constraints and penalty factors.
 */
export interface ICostRule {
    metricId: string;
    limit: number;
    penaltyFactor: number;
}

// Maps for O(1) lookup
type RulesMap = Map<string, ICostRule>;
type MetricsMap = Map<string, IGovernanceMetric>;

/**
 * Registry interface for sourcing Governance Cost Rules.
 */
export interface ICostRuleConfigRegistryKernel {
    getCostRules(): Promise<ICostRule[]>;
}

/**
 * Registry interface for sourcing Governance Metrics configuration.
 */
export interface IGovernanceMetricConfigRegistryKernel {
    getGovernanceMetrics(): Promise<IGovernanceMetric[]>;
}

/**
 * The Cost Rule Engine Kernel.
 * Refactored to eliminate synchronous configuration storage and synchronous coupling
 * to external utilities via strict Dependency Injection and asynchronous initialization.
 */
export class CostRuleEngineKernel {
    // Dependencies
    private rulesRegistry: ICostRuleConfigRegistryKernel;
    private metricsRegistry: IGovernanceMetricConfigRegistryKernel;
    private memoizerTool: IFunctionMemoizerToolKernel;
    private calculatorTool: IMetricCostCalculatorToolKernel;

    // Internal State (Initialized asynchronously)
    private rulesMap: RulesMap;
    private metricsMap: MetricsMap;
    private calculateMetricCostMemoized: (metricId: string, value: number) => number;

    /**
     * Initializes the kernel by injecting all necessary dependencies.
     * Configuration loading (Rules and Metrics) is deferred to the asynchronous initialize() method.
     */
    constructor(
        rulesRegistry: ICostRuleConfigRegistryKernel,
        metricsRegistry: IGovernanceMetricConfigRegistryKernel,
        memoizerTool: IFunctionMemoizerToolKernel,
        calculatorTool: IMetricCostCalculatorToolKernel
    ) {
        this.#setupDependencies(rulesRegistry, metricsRegistry, memoizerTool, calculatorTool);
    }

    /**
     * Rigorously isolates synchronous dependency assignment and validation.
     */
    #setupDependencies(
        rulesRegistry: ICostRuleConfigRegistryKernel,
        metricsRegistry: IGovernanceMetricConfigRegistryKernel,
        memoizerTool: IFunctionMemoizerToolKernel,
        calculatorTool: IMetricCostCalculatorToolKernel
    ): void {
        if (!rulesRegistry || !metricsRegistry || !memoizerTool || !calculatorTool) {
            throw new Error("CostRuleEngineKernel: All dependencies (Registries, Tools) must be provided.");
        }
        this.rulesRegistry = rulesRegistry;
        this.metricsRegistry = metricsRegistry;
        this.memoizerTool = memoizerTool;
        this.calculatorTool = calculatorTool;
        
        // Initialize internal state placeholder
        this.rulesMap = new Map(); 
        this.metricsMap = new Map();
        this.calculateMetricCostMemoized = (() => { throw new Error("CostRuleEngineKernel not initialized. Call initialize() first."); }) as any;
    }

    /**
     * Asynchronously loads configuration data, builds internal maps, and sets up memoization.
     */
    public async initialize(): Promise<void> {
        const rules = await this.rulesRegistry.getCostRules();
        const metrics = await this.metricsRegistry.getGovernanceMetrics();

        // Utilize efficient data structures (Hash Maps/Maps) for O(1) lookups
        this.rulesMap = new Map(rules.map(r => [r.metricId, r]));
        this.metricsMap = new Map(metrics.map(m => [m.id, m]));
        
        // Implement Memoization using the injected tool
        this.calculateMetricCostMemoized = this.memoizerTool.memoize(
            this.calculateMetricCostAbstraction.bind(this),
            // Custom simple serializer for key generation (metricId:value)
            (args: [string, number]) => `${args[0]}:${args[1]}` 
        );
    }

    /**
     * Core cost calculation logic. Performs O(1) lookups and delegates the pure calculation
     * to the injected MetricCostCalculator Tool.
     * @param metricId The ID of the metric being evaluated.
     * @param value The current value of the metric.
     * @returns The calculated cost.
     */
    private calculateMetricCostAbstraction(metricId: string, value: number): number {
        const metric = this.metricsMap.get(metricId); // O(1) lookup

        if (!metric) {
            return 0;
        }

        const rule = this.rulesMap.get(metricId); // O(1) lookup

        // Delegate pure calculation logic to the injected tool
        return this.calculatorTool.calculate(metric, rule, value);
    }

    /**
     * Calculates the total governance cost by aggregating the costs of all metrics.
     * @returns The total aggregated cost.
     */
    public calculateTotalGovernanceCost(): number {
        // Use functional iteration (reduce) and the memoized function for efficiency
        return Array.from(this.metricsMap.values()).reduce((totalCost, metric) => {
            const metricCost = this.calculateMetricCostMemoized(metric.id, metric.value);
            return totalCost + metricCost;
        }, 0);
    }
    
    /**
     * Calculates costs grouped by category (Example of further recursive aggregation).
     * @returns A map of category ID to total cost.
     */
    public calculateCategorizedCosts(): Map<string, number> {
        const categoryCosts = new Map<string, number>();

        for (const metric of this.metricsMap.values()) {
            const cost = this.calculateMetricCostMemoized(metric.id, metric.value);
            const currentTotal = categoryCosts.get(metric.category) || 0;
            categoryCosts.set(metric.category, currentTotal + cost);
        }

        return categoryCosts;
    }
}