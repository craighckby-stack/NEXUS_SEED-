/**
 * src/governance/PerformanceMetricGeneratorKernel.js
 * Purpose: Calculates a standardized performance metric [0.0, 1.0] by applying weighted penalties
 * to deviations from optimal audit metrics (1.0). This metric feeds into the Trust Matrix.
 *
 * Refactored to adhere to kernel architecture: asynchronous operation, configuration separation,
 * and formalized dependency injection.
 */

// Defining required interfaces for clarity (assuming injection of implementations)

interface AuditData {
    complianceScore: number;
    violationCount: number;
    efficiencyScore: number;
}

// Assumed types for Registry Kernels (must be defined elsewhere)
interface MetricWeightsConfig {
    COMPLIANCE_DEVIATION_WEIGHT: number;
    EFFICIENCY_DEVIATION_WEIGHT: number;
    POLICY_VIOLATION_PENALTY: number;
}

interface IMetricWeightsConfigRegistryKernel {
    getMetricWeights(): Promise<MetricWeightsConfig>;
}

interface IPerformanceMetricSchemaRegistryKernel {
    getAuditDataSchema(): Promise<object>;
}

// Assumed standard governance interfaces
declare const ISpecValidatorKernel: any; // Available via ACTIVE_TOOLS
declare const ILoggerToolKernel: any; // Standard Tool Kernel

// Tool Kernel defined in plugin output
declare const IWeightedDeviationScorerToolKernel: any;

interface PerformanceMetricGeneratorDependencies {
    specValidatorKernel: ISpecValidatorKernel;
    weightsRegistry: IMetricWeightsConfigRegistryKernel;
    schemaRegistry: IPerformanceMetricSchemaRegistryKernel;
    scorerToolKernel: IWeightedDeviationScorerToolKernel;
    logger: ILoggerToolKernel; 
}

class PerformanceMetricGeneratorKernel {
    
    private weights: MetricWeightsConfig;
    private auditDataSchema: object;

    private readonly specValidatorKernel: ISpecValidatorKernel;
    private readonly weightsRegistry: IMetricWeightsConfigRegistryKernel;
    private readonly schemaRegistry: IPerformanceMetricSchemaRegistryKernel;
    private readonly scorerToolKernel: IWeightedDeviationScorerToolKernel;
    private readonly logger: ILoggerToolKernel;

    constructor(deps: PerformanceMetricGeneratorDependencies) {
        this.#setupDependencies(deps);
    }

    #setupDependencies(deps: PerformanceMetricGeneratorDependencies): void {
        if (!deps.specValidatorKernel || !deps.weightsRegistry || !deps.schemaRegistry || !deps.scorerToolKernel || !deps.logger) {
            throw new Error("Missing required dependencies for PerformanceMetricGeneratorKernel.");
        }
        this.specValidatorKernel = deps.specValidatorKernel;
        this.weightsRegistry = deps.weightsRegistry;
        this.schemaRegistry = deps.schemaRegistry;
        this.scorerToolKernel = deps.scorerToolKernel;
        this.logger = deps.logger;
    }

    async initialize(): Promise<void> {
        try {
            [this.weights, this.auditDataSchema] = await Promise.all([
                this.weightsRegistry.getMetricWeights(),
                this.schemaRegistry.getAuditDataSchema()
            ]);
            this.logger.debug("PerformanceMetricGeneratorKernel initialized successfully.");
        } catch (error) {
            this.logger.error("Failed to load critical configuration or schema during initialization.", error);
            throw new Error("Initialization failed: Required governance configurations are missing.");
        }
    }

    /**
     * Synthesizes a unified trust metric based on recent operational performance data.
     * @param actorId - The ID of the component being audited.
     * @param auditData - Aggregated and normalized data points for a specific actor.
     * @returns A Promise resolving to the calculated performance metric between 0.0 and 1.0.
     */
    async generateMetric(actorId: string, auditData: Partial<AuditData>): Promise<number> {
        
        // 1. Apply defaults
        const defaultedData: AuditData = {
            complianceScore: auditData.complianceScore ?? 1.0,
            violationCount: auditData.violationCount ?? 0,
            efficiencyScore: auditData.efficiencyScore ?? 1.0,
        };

        // 2. Validation using ISpecValidatorKernel
        const validationResult = await this.specValidatorKernel.validate(defaultedData, this.auditDataSchema);
        
        if (!validationResult.isValid) {
            this.logger.warn(`Audit Data Validation Failed for actor ${actorId}. Errors: ${validationResult.errors.join('; ')}`);
            throw new Error(`Audit Data Validation Failed for actor ${actorId}: ${validationResult.errors.join('; ')}`);
        }
        
        const { complianceScore, violationCount, efficiencyScore } = defaultedData;

        // 3. Calculation using the IWeightedDeviationScorerToolKernel
        
        const scoringArguments = {
            baseScore: 1.0,
            weightedDeviations: [
                { 
                    score: complianceScore, 
                    weight: this.weights.COMPLIANCE_DEVIATION_WEIGHT 
                },
                {
                    score: efficiencyScore,
                    weight: this.weights.EFFICIENCY_DEVIATION_WEIGHT
                }
            ],
            fixedPenalties: [
                {
                    count: violationCount,
                    penaltyPerCount: this.weights.POLICY_VIOLATION_PENALTY
                }
            ]
        };

        return this.scorerToolKernel.execute(scoringArguments);
    }
}

module.exports = PerformanceMetricGeneratorKernel;