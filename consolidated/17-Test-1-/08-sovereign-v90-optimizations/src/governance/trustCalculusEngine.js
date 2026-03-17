/**
 * Trust Calculus Engine Kernel (TCEK) - src/governance/TrustCalculusEngineKernel.js
 * ID: TCEK v100.0 (AIA Compliant)
 * Role: Asynchronous Configurable Decision Scoring Orchestrator
 *
 * TCEK is responsible for loading governance model configurations and delegating
 * all complex metric aggregation, transformation, and normalization logic to the
 * specialized IMaturityMetricDeriverToolKernel, strictly adhering to AIA mandates
 * for non-blocking execution and Maximum Recursive Abstraction.
 */

class TrustCalculusEngineKernel {
    /**
     * @param {TrustModelConfigurationStoreKernel} trustModelStore - Kernel for loading trust models.
     * @param {IMaturityMetricDeriverToolKernel} metricDeriverTool - Kernel for performing weighted calculation and normalization.
     */
    constructor({ trustModelStore, metricDeriverTool }) {
        if (!trustModelStore || !metricDeriverTool) {
            throw new Error("TCE Kernel requires TrustModelConfigurationStoreKernel and IMaturityMetricDeriverToolKernel.");
        }
        this.trustModelStore = trustModelStore;
        this.metricDeriverTool = metricDeriverTool;
        this.models = {}; // Internal cache for loaded models. Loaded asynchronously.
    }

    /**
     * Initializes the kernel, loading governance model definitions asynchronously from the store.
     * @async
     */
    async initialize() {
        // Load configurations dynamically and asynchronously from the dedicated store
        try {
            // Assuming TrustModelConfigurationStoreKernel provides a method to retrieve all models.
            const configData = await this.trustModelStore.getTrustModels(); 
            
            if (configData && configData.models) {
                this.models = configData.models;
            } else {
                console.warn("[TCEK] Trust model configuration loaded, but models key is missing or empty. Using empty set.");
            }
            console.log(`[TrustCalculusEngineKernel] Initialized, loaded ${Object.keys(this.models).length} governance models.`);
        } catch (error) {
            console.error("[TCEK] CRITICAL: Failed to initialize trust models from configuration store.", error);
            throw new Error("TCE Kernel initialization failed: Trust model data could not be retrieved.");
        }
    }

    /**
     * Calculates a composite score based on defined weights, explicit metric transformation,
     * and input metrics for a specific governance model.
     * 
     * This method delegates all computational complexity to the IMaturityMetricDeriverToolKernel.
     * 
     * @param {string} modelId - The specific model to use (e.g., 'RETIREMENT_CALCULUS').
     * @param {object} metricData - Input metrics (key/value pairs, assumed 0.0 to 1.0 range).
     * @returns {Promise<number>} The calculated normalized score (0.0 to 1.0).
     */
    async calculateScore(modelId, metricData) {
        const model = this.models[modelId];
        if (!model || !model.metrics) {
            throw new Error(`TCEK Error: Trust Calculus Model '${modelId}' not configured or missing metric definitions. Models must be loaded via initialize().`);
        }
        
        const calculationArgs = {
            metricDefinitions: model.metrics, // The weight and type definitions (PROFIT/RISK)
            metricData: metricData            // The raw input values
        };

        try {
            // Delegation to the specialized Tool Kernel for all aggregation, transformation, and normalization.
            const normalizedScore = await this.metricDeriverTool.deriveMaturityMetric(calculationArgs);
            
            return normalizedScore; 
            
        } catch (error) {
            console.error(`[TCEK] Critical failure during score calculation for model '${modelId}'. Delegation failed.`, error);
            // Re-throw standardized error
            throw new Error(`TCE Kernel Calculation failed for model ${modelId}: ${error.message}`);
        }
    }
}

// AIA Mandate: Do not export a synchronously instantiated singleton.
export { TrustCalculusEngineKernel };