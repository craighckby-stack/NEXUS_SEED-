import { IMigrationCostDeriverToolKernel } from './interfaces/IMigrationCostDeriverToolKernel';
import { IMigrationCostConfigRegistryKernel, MigrationCostConfig } from './registry/IMigrationCostConfigRegistryKernel';

/**
 * Type definition for the immutable cost estimate result.
 */
type CostEstimate = Readonly<{
    durationMs: number;
    resources: Readonly<{
        cpu: number;
        memory: number;
        io: number;
    }>
}>;

/**
 * Migration Cost Modeler Kernel (MCM) V2.0
 * Predicts CPU, Memory, I/O, and Time complexity for schema migrations.
 * Adheres to AIA Enforcement Layer mandates for asynchronous execution and auditable dependency injection.
 */
export class MigrationCostModelerKernel {

    private config!: Readonly<MigrationCostConfig>;
    private initialized: boolean = false;

    /**
     * @param costDeriver - High-integrity asynchronous tool for weighted score calculation.
     * @param configRegistry - Asynchronous registry for retrieving immutable cost model parameters.
     */
    constructor(
        private readonly costDeriver: IMigrationCostDeriverToolKernel,
        private readonly configRegistry: IMigrationCostConfigRegistryKernel
    ) {}

    /**
     * Asynchronously initializes the kernel, loading configuration securely.
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        // Load configuration using the asynchronous registry
        const config = await this.configRegistry.getCostModelConfiguration();
        
        // Enforce immutability and apply defaults if necessary
        this.config = Object.freeze({
            ioFactor: config.ioFactor ?? 1.2,
            cpuFactor: config.cpuFactor ?? 0.85,
            baseOverheadMs: config.baseOverheadMs ?? 500
        });

        this.initialized = true;
    }

    /**
     * Helper to call the asynchronous weighted metric derivation kernel.
     */
    private async calculateScore(inputs: Readonly<Record<string, number>>, weights: Readonly<Record<string, number>>, scalingFactor: number = 1, baseOffset: number = 0): Promise<number> {
        if (!this.initialized) {
            throw new Error("MCM Kernel not initialized. Call initialize() first.");
        }
        return this.costDeriver.calculateWeightedScore({
            inputs: inputs,
            weights: weights,
            scalingFactor: scalingFactor,
            baseOffset: baseOffset
        });
    }

    /**
     * Asynchronously estimates the full migration cost profile based on analysis inputs.
     * @param diffAnalysis - The immutable input structure from differential analysis.
     * @returns {Promise<CostEstimate>} Immutable cost profile.
     */
    public async estimateCosts(
        diffAnalysis: Readonly<{ complexityScore: number, breakingChangesCount: number, dataTransformationRequired: boolean }>
    ): Promise<CostEstimate> {
        if (!this.initialized) {
            throw new Error("MCM Kernel must be initialized before estimating costs.");
        }

        const complexity = diffAnalysis.complexityScore;
        const breaking = diffAnalysis.breakingChangesCount;
        const inputs = Object.freeze({ complexity, breaking });

        // --- 1. Time Duration Estimate (Asynchronous Calls) ---
        
        // Contribution 1: CPU-bound complexity
        const cpuTimeContribution = await this.calculateScore(
            inputs,
            Object.freeze({ complexity: 1500 }),
            this.config.cpuFactor
        );

        // Contribution 2: IO-bound breaking changes
        const ioTimeContribution = await this.calculateScore(
            inputs,
            Object.freeze({ breaking: 500 }),
            this.config.ioFactor
        );
        
        const estimatedTime = this.config.baseOverheadMs + cpuTimeContribution + ioTimeContribution;

        // --- 2. Resource Estimation (Asynchronous Calls) ---
        
        // CPU Usage
        const cpuUsage = await this.calculateScore(inputs, Object.freeze({
            complexity: 0.1, 
            breaking: 0.5
        }));

        // Memory Usage
        const memoryUsage = await this.calculateScore(inputs, Object.freeze({
            complexity: 0.05,
            breaking: 0.3
        }));

        // I/O Usage
        let ioUsage: number;
        if (diffAnalysis.dataTransformationRequired) {
            ioUsage = await this.calculateScore(inputs, Object.freeze({
                breaking: 1.5,
                complexity: 0.1
            }));
        } else {
            ioUsage = await this.calculateScore(inputs, Object.freeze({
                complexity: 0.05
            }));
        }

        // Return immutable result structure
        return Object.freeze({
            durationMs: Math.ceil(estimatedTime),
            resources: Object.freeze({
                cpu: Math.min(10.0, cpuUsage), 
                memory: Math.min(10.0, memoryUsage), 
                io: Math.min(10.0, ioUsage) 
            })
        });
    }
}