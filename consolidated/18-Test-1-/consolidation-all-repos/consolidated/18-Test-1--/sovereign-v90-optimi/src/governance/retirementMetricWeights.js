import { MetricPresetRegistryKernel } from '@AGI/core/MetricPresetRegistryKernel';
import { IRegistryInitializerToolKernel } from '@AGI/tools/IRegistryInitializerToolKernel';

/**
 * AGI-KERNEL: TrustCalculusMetricPresetRegistryKernel (TCM-R)
 * 
 * This Kernel replaces the synchronous `retirementMetricWeights.js` configuration file.
 * It ensures the P-01 Trust Calculus Metric Definitions are loaded asynchronously, validated,
 * and registered using audited standard Registry Kernels, eliminating reliance on synchronous
 * configuration exports and ad-hoc utility calls (e.g., MetricConfigurationUtility.execute).
 */
export class TrustCalculusMetricPresetRegistryKernel {
    private readonly metricPresetRegistry: MetricPresetRegistryKernel;
    private readonly registryInitializer: IRegistryInitializerToolKernel;

    /**
     * Static configuration for Governance Categories.
     */
    private static readonly GOVERNANCE_CATEGORIES = {
        SAFETY: "Metrics promoting component stability and high confidence in retention.",
        RISK: "Metrics indicating potential downstream failure or exposure.",
        OVERHEAD: "Metrics related to system maintenance burden and resource drain.",
        USAGE: "Metrics tied directly to component adoption and operational activity rates."
    };

    /**
     * Static configuration for P-01 Trust Calculus Metric Definitions.
     */
    private static readonly METRIC_DEFINITIONS = {
        
        // 1. SAFETY FACTORS (High metric value is generally positive)
        SUBSIDIARY_REDUNDANCY_SCORE: {
            weight: 1.5,
            category: 'SAFETY',
            influence: 'positive',
            normalization: { 
                strategy: 'linear_minmax', 
                bounds: [0, 5] // Expected raw score range
            },
            description: "Confidence derived from having robust substitutes or alternatives. Higher score is better."
        },

        // 2. RISK FACTORS (High metric value is generally negative)
        CRITICAL_DEPENDENCY_EXPOSURE: {
            weight: 2.0, 
            category: 'RISK',
            influence: 'negative',
            normalization: { 
                strategy: 'logarithmic',
            }, 
            description: "Critical risk based on the severity and breadth of downstream reliance. Higher count is worse."
        },
        
        // 3. OVERHEAD FACTORS 
        COMPONENT_COMPLEXITY_SCORE: {
            weight: 1.2,
            category: 'OVERHEAD',
            influence: 'negative', 
            normalization: {
                strategy: 'percentile_rank', 
            },
            description: "Measures inherent code complexity. High complexity increases retirement viability (negative influence)."
        },
        MAINTENANCE_BURDEN_INDEX: {
            weight: 1.0,
            category: 'OVERHEAD',
            influence: 'negative', 
            normalization: { 
                strategy: 'linear_minmax',
                bounds: [0, 500] // Hours per quarter
            },
            description: "Index tracking accumulated resource hours spent on mandatory component upkeep."
        },
        
        // 4. USAGE ADJUSTMENT FACTORS
        DAILY_USAGE_RATE: {
            weight: 1.8,
            category: 'USAGE',
            influence: 'positive', 
            normalization: { 
                strategy: 'linear_minmax',
                bounds: [0, 1000000]
            }, 
            description: "Raw metric of daily transaction/call volume. Normalized to penalize values below critical threshold via non-linear mapping in preprocessor."
        }
    };

    /**
     * @param metricPresetRegistry MetricPresetRegistryKernel instance for data persistence.
     * @param registryInitializer Tool Kernel to guarantee asynchronous and audited registration.
     */
    constructor(
        metricPresetRegistry: MetricPresetRegistryKernel,
        registryInitializer: IRegistryInitializerToolKernel
    ) {
        this.metricPresetRegistry = metricPresetRegistry;
        this.registryInitializer = registryInitializer;
    }

    /**
     * @async
     * Asynchronously loads and validates the Trust Calculus metric definitions (P-01).
     * This execution must complete before the definitions are available for the CORE engine.
     */
    public async initialize(): Promise<void> {
        // Delegate configuration registration and validation to the specialized Tool Kernel.
        await this.registryInitializer.registerMetricPresets(
            this.metricPresetRegistry,
            TrustCalculusMetricPresetRegistryKernel.METRIC_DEFINITIONS,
            TrustCalculusMetricPresetRegistryKernel.GOVERNANCE_CATEGORIES
        );
    }

    /**
     * Retrieves the metric definition for a specific key.
     * @param metricKey The key of the metric.
     * @returns The stored metric configuration.
     */
    public getDefinition(metricKey: string) {
        return this.metricPresetRegistry.getMetricPreset(metricKey);
    }

    /**
     * Retrieves all registered metric definitions.
     */
    public getAllDefinitions() {
        return this.metricPresetRegistry.getAllMetricPresets();
    }
}