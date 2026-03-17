/**
 * Retirement Metrics Kernel (RMK) - src/governance/RetirementMetricsKernel.js
 * ID: RMK_A12
 * Role: High-Integrity Asynchronous Metric Calculation & Weighting
 * 
 * RMK orchestrates the non-blocking calculation and weighting of specific metrics 
 * required for CORE's P-01 Trust Calculus adjudication, ensuring strict adherence 
 * to AIA enforcement layer mandates for data provenance and abstraction.
 */

import { MetricPresetRegistryKernel } from "./MetricPresetRegistryKernel";
import { IExternalMetricExecutionToolKernel } from "../tools/IExternalMetricExecutionToolKernel";
import { MetricNormalizerToolKernel } from "../tools/MetricNormalizerToolKernel";
import { MultiTargetAuditDisperserToolKernel } from "../tools/MultiTargetAuditDisperserToolKernel";
import { EnvironmentTypeDecoderInterfaceKernel } from "../tools/EnvironmentTypeDecoderInterfaceKernel";

// Strategic Constants defined for abstraction and auditability
const RETIREMENT_TRUST_CALCULUS_PRESET = 'RETIREMENT_P01_TC_V1';
const RAW_METRIC_GROUP_ID = 'COMP_OBSOLESCENCE_RAW_V1';

export class RetirementMetricsKernel {
    #metricPresetRegistry;
    #externalMetricExecutionTool;
    #metricNormalizerTool;
    #auditDisperser;
    #environmentDecoder;
    #retirementMetricPreset;
    #isInitialized = false;

    /**
     * @param {{ 
     *  metricPresetRegistry: MetricPresetRegistryKernel,
     *  externalMetricExecutionTool: IExternalMetricExecutionToolKernel,
     *  metricNormalizerTool: MetricNormalizerToolKernel,
     *  auditDisperser: MultiTargetAuditDisperserToolKernel,
     *  environmentDecoder: EnvironmentTypeDecoderInterfaceKernel
     * }} dependencies 
     */
    constructor(dependencies) {
        // Strict adherence to dependency injection for maximum recursive abstraction
        this.#metricPresetRegistry = dependencies.metricPresetRegistry;
        this.#externalMetricExecutionTool = dependencies.externalMetricExecutionTool;
        this.#metricNormalizerTool = dependencies.metricNormalizerTool;
        this.#auditDisperser = dependencies.auditDisperser;
        this.#environmentDecoder = dependencies.environmentDecoder; // Standard dependency
    }

    /**
     * Mandatory asynchronous initialization, eliminating synchronous configuration loading.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.#isInitialized) return;
        
        // Configuration loading is delegated asynchronously
        this.#retirementMetricPreset = await this.#metricPresetRegistry.getPreset(RETIREMENT_TRUST_CALCULUS_PRESET);

        if (!this.#retirementMetricPreset) {
            throw new Error(`RMK failed to load critical preset: ${RETIREMENT_TRUST_CALCULUS_PRESET}`);
        }

        this.#isInitialized = true;
        this.#auditDisperser.publish('SYSTEM', 'RMK_INIT_SUCCESS', { 
            presetId: RETIREMENT_TRUST_CALCULUS_PRESET, 
            environment: this.#environmentDecoder.getEnvironmentType() 
        });
    }

    /**
     * Gathers all necessary weighted data points for a retirement review, utilizing
     * specialized Tool Kernels for data fetching and processing.
     * @param {string} componentId - The component to analyze.
     * @returns {Promise<object>} Calculated and weighted metrics ready for CORE consumption.
     */
    async getComponentMetrics(componentId) {
        if (!this.#isInitialized) {
            throw new Error('RetirementMetricsKernel must be initialized before use.');
        }
        if (!componentId || typeof componentId !== 'string') {
            this.#auditDisperser.publish('ERROR', 'RMK_INVALID_INPUT', { context: 'getComponentMetrics' });
            throw new Error('RMK requires a valid component identifier.');
        }

        try {
            // Step 1: Fetch raw data. Logic is delegated to IExternalMetricExecutionToolKernel,
            // abstracting away systemStateMonitor, dependencyGraph, usageTelemetry, and StaticAnalysisEngine.
            const rawMetrics = await this.#externalMetricExecutionTool.fetchMetrics(
                RAW_METRIC_GROUP_ID, 
                { targetId: componentId }
            );

            // Step 2: Apply normalization, transformations (e.g., 1-usageRate), weights, and calculate final composite score.
            // Logic previously in _processAndWeighMetrics and WeightedConstraintScorer is delegated.
            const normalizedResult = await this.#metricNormalizerTool.normalizeAndWeigh({
                rawMetrics: rawMetrics,
                presetId: RETIREMENT_TRUST_CALCULUS_PRESET,
                // Assuming the tool's internal configuration (via preset) defines how 
                // raw metrics map to weighted factors (safety, risk, overhead, usagePenalty).
            });

            const adjudicationInput = {
                // Main normalized input for CORE's P-01 function (Trust Calculus composite score)
                trustCalculusInput: normalizedResult.compositeScore,

                // Detailed Weighted Factors for auditing and traceability
                safetyFactor: normalizedResult.weightedFactors.redundancyScore,
                riskFactor: normalizedResult.weightedFactors.criticalDependencyExposure, 
                overheadFactor: normalizedResult.weightedFactors.complexityReductionEstimate,
                usagePenalty: normalizedResult.weightedFactors.usagePenaltyInput
            };

            this.#auditDisperser.publish('INFO', 'RMK_METRIC_GENERATED', {
                componentId,
                compositeScore: normalizedResult.compositeScore,
                raw: rawMetrics,
                adjudicationInput
            });

            return {
                raw: rawMetrics,
                adjudicationInput: adjudicationInput
            };

        } catch (error) {
            this.#auditDisperser.publish('CRITICAL', 'RMK_ORCHESTRATION_FAILURE', { 
                componentId, 
                error: error.message 
            });
            throw new Error(`RMK Calculation Orchestration Failure: ${error.message}`);
        }
    }
}