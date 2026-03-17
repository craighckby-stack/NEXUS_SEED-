import {
    ITrustCalculusConfigRegistryKernel,
    IPolarizedWeightedScorerToolKernel,
    ILoggerToolKernel
} from "@strategic-interfaces";

/**
 * CoreTrustCalculatorKernel
 * Converts raw component metrics into a single normalized Trust Score (0.0 to 1.0) 
 * using the injected Polarized Weighted Scorer Tool.
 */
export class CoreTrustCalculatorKernel {
    #trustConfigRegistry: ITrustCalculusConfigRegistryKernel;
    #scorerTool: IPolarizedWeightedScorerToolKernel;
    #logger: ILoggerToolKernel;
    
    /**
     * @param trustConfigRegistry ITrustCalculusConfigRegistryKernel
     * @param scorerTool IPolarizedWeightedScorerToolKernel
     * @param logger ILoggerToolKernel
     */
    constructor(
        trustConfigRegistry: ITrustCalculusConfigRegistryKernel,
        scorerTool: IPolarizedWeightedScorerToolKernel,
        logger: ILoggerToolKernel
    ) {
        this.#setupDependencies(trustConfigRegistry, scorerTool, logger);
    }

    async initialize(): Promise<void> {
        // Configuration loading is handled dynamically in calculateScore.
        return;
    }

    #setupDependencies(
        trustConfigRegistry: ITrustCalculusConfigRegistryKernel,
        scorerTool: IPolarizedWeightedScorerToolKernel,
        logger: ILoggerToolKernel
    ): void {
        if (!trustConfigRegistry || !scorerTool || !logger) {
            throw new Error('CoreTrustCalculatorKernel requires Trust Calculus Registry, Scorer Tool, and Logger.');
        }
        this.#trustConfigRegistry = trustConfigRegistry;
        this.#scorerTool = scorerTool;
        this.#logger = logger;
    }

    /**
     * Calculates the normalized Trust Score.
     * @param {Record<string, number>} rawMetrics - Input metrics (0.0 to 1.0).
     * @returns {Promise<number>} The final normalized Trust Score (0.0 to 1.0).
     * @throws {Error} If scoring fails (e.g., missing metrics, range violation).
     */
    async calculateScore(rawMetrics: Record<string, number>): Promise<number> {
        
        try {
            // Asynchronously retrieve configuration data from the dedicated Registry Kernel
            const scoringSchema = await this.#trustConfigRegistry.getTrustMetricsSchema();
            const negativePolarityKey = await this.#trustConfigRegistry.getTrustPolarityNegativeKey();

            // Delegate the core logic to the injected asynchronous tool
            return await this.#scorerTool.calculate({
                rawMetrics: rawMetrics,
                scoringSchema: scoringSchema,
                negativePolarityKey: negativePolarityKey
            });

        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            this.#logger.error('[CoreTrustCalculatorKernel] Scoring failure during calculation.', { 
                error: error.message, 
                metrics: rawMetrics 
            });
            // Re-throw standardized error reflecting the asynchronous failure
            throw new Error(`Trust scoring failed: ${error.message}`);
        }
    }
}