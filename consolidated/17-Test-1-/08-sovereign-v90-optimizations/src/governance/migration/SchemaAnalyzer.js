/**
 * AGI-KERNEL: SchemaAnalyzerKernel (v1.0)
 * High-integrity, asynchronous core service for Schema Migration Simulation Engine.
 * This kernel replaces the synchronous SchemaAnalyzer utility, strictly adhering 
 * to the AIA Enforcement Layer mandates for non-blocking execution, recursive abstraction,
 * and auditable dependency injection.
 */

// Internal Interfaces Definition (For Audited Dependency Injection)

interface ISchemaMetricCalculatorToolKernel {
    calculate(params: {
        schemaA: object,
        breakingChangeCount: number,
        affectedCount: number,
        dependencyGraph: object | null,
        config: object
    }): Promise<Readonly<{ complexityScore: number, efficiencyScore: number }>>;
}

interface ISchemaAnalyzerConfigRegistryKernel {
    initialize(): Promise<void>;
    getAnalyzerConfiguration(): Promise<Readonly<{ complexityWeight: number, criticalityThreshold: number, [key: string]: any }>>;
}

interface IRawSchemaDiffGeneratorToolKernel {
    generate(schemaA: object, schemaB: object): Promise<ReadonlyArray<object>>;
}

interface IChangeClassificationEngineToolKernel {
    classify(
        rawDiffs: ReadonlyArray<object>, 
        config: Readonly<{ criticalityThreshold: number }>
    ): Promise<Readonly<{ breakingChanges: ReadonlyArray<object>, nonBreakingChanges: ReadonlyArray<object>, entitiesAffected: ReadonlySet<string> }>>;
}

export class SchemaAnalyzerKernel {
    private config: Readonly<{ complexityWeight: number, criticalityThreshold: number, [key: string]: any }> = Object.freeze({});

    /**
     * Initializes the Kernel with required asynchronous dependencies.
     * All intensive computational and I/O tasks are delegated to specialized Tool Kernels.
     */
    constructor(
        private readonly configRegistry: ISchemaAnalyzerConfigRegistryKernel,
        private readonly metricCalculator: ISchemaMetricCalculatorToolKernel,
        private readonly diffGenerator: IRawSchemaDiffGeneratorToolKernel,
        private readonly classificationEngine: IChangeClassificationEngineToolKernel
    ) {
        // Configuration loading is strictly asynchronous via initialize().
    }

    /**
     * Initializes the Kernel by asynchronously loading and immutably freezing configuration.
     */
    public async initialize(): Promise<void> {
        const loadedConfig = await this.configRegistry.getAnalyzerConfiguration();
        this.config = Object.freeze(loadedConfig);
    }

    /**
     * Executes the schema analysis delta computation.
     * 
     * @param schemaA - The baseline normalized schema graph.
     * @param schemaB - The proposed normalized schema graph.
     * @param dependencyGraph - Pre-calculated dependency map (optional).
     * @returns Immutable analysis results.
     */
    public async computeDelta(
        schemaA: object, 
        schemaB: object, 
        dependencyGraph: object | null = null
    ): Promise<Readonly<{
        metrics: Readonly<{ complexityScore: number, breakingChangesCount: number, efficiencyScore: number }>,
        criticalChanges: ReadonlyArray<object>,
        nonBreakingChanges: ReadonlyArray<object>,
        entitiesAffected: ReadonlyArray<string>
    }>> {
        if (!schemaA || !schemaB) {
            throw new Error("KRNL_SA_001: Both schemas must be provided for delta computation.");
        }

        // Step 1: Generate detailed, raw differences (Delegated to specialized Tool Kernel)
        const rawDiffs = await this.diffGenerator.generate(schemaA, schemaB);
        
        // Step 2: Classify and categorize changes (Delegated to specialized Tool Kernel)
        const classified = await this.classificationEngine.classify(rawDiffs, {
            criticalityThreshold: this.config.criticalityThreshold
        });
        
        // Step 3: Compute final metrics (Delegated to specialized Tool Kernel, replacing synchronous plugin)
        const { complexityScore, efficiencyScore } = await this.metricCalculator.calculate({
            schemaA: schemaA, 
            breakingChangeCount: classified.breakingChanges.length, 
            affectedCount: classified.entitiesAffected.size,
            dependencyGraph: dependencyGraph,
            config: this.config
        });

        // Ensure all output structures are immutable
        return Object.freeze({
            metrics: Object.freeze({
                complexityScore,
                breakingChangesCount: classified.breakingChanges.length,
                efficiencyScore
            }),
            criticalChanges: Object.freeze(Array.from(classified.breakingChanges)),
            nonBreakingChanges: Object.freeze(Array.from(classified.nonBreakingChanges)),
            entitiesAffected: Object.freeze(Array.from(classified.entitiesAffected))
        });
    }
}