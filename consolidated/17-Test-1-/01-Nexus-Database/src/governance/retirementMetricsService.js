/**
 * Retirement Metrics Service (RMS) - src/governance/retirementMetricsService.js
 * ID: RMS_V94
 * Role: Data Provisioning / Metric Calculation & Weighting
 *
 * RMS calculates and aggregates highly specific, weighted metrics required by CORE
 * (Component Obsolescence Review Engine) to perform P-01 Trust Calculus adjudication.
 * It focuses on system Safety (Redundancy), Risk (Dependency Exposure), and Overhead (Complexity).
 */

import { systemStateMonitor } from '../core/systemStateMonitor.js';
import { dependencyGraph } from '../analysis/dependencyGraph.js';
import { usageTelemetry } from '../analysis/usageTelemetry.js';
import { StaticAnalysisEngine } from '../analysis/staticAnalysisEngine.js'; // New dedicated dependency for structural metrics
import { Logger } from '../utils/logger.js';
import { METRIC_WEIGHTS } from './retirementMetricWeights.js';

const logger = new Logger('RMS');

export const retirementMetricsService = {

    /**
     * Helper function to robustly fetch all raw, unweighted metric scores in parallel.
     * Integrates the StaticAnalysisEngine for complexity metrics.
     * @param {string} componentId - The component to analyze.
     * @returns {Promise<object>} Raw metric scores.
     */
    async _fetchRawMetrics(componentId) {
        logger.debug(`Fetching raw metrics concurrently for ${componentId}.`);

        // Execute independent asynchronous metrics calculations in parallel using Promise.all.
        const [
            redundancyScore,
            criticalDependencyExposure,
            usageRate,
            complexityMetrics
        ] = await Promise.all([
            // 1. Safety Metric (Redundancy): Higher score means safer removal.
            systemStateMonitor.calculateRedundancy(componentId),

            // 2. Risk Metric (Exposure): Higher score means higher downstream risk.
            dependencyGraph.analyzeCriticalDownstreamRisk(componentId),

            // 3. Operational Metric (Usage Rate): Should be normalized 0.0 to 1.0
            usageTelemetry.getHistoricalAverage(componentId),

            // 4. Overhead Metric (Complexity): Replaced heuristic with dedicated engine.
            StaticAnalysisEngine.analyzeComplexityBenefit(componentId)
        ]);

        // Note: StaticAnalysisEngine.analyzeComplexityBenefit must return an object containing 'complexityReductionEstimate'

        return {
            redundancyScore,
            criticalDependencyExposure,
            usageRate: Math.max(0, Math.min(1, usageRate)), // Ensure strict normalization
            complexityReductionEstimate: complexityMetrics.complexityReductionEstimate
        };
    },

    /**
     * Processes raw metric scores into normalized, weighted inputs for the CORE Trust Calculus.
     * This ensures standardized, governed input based on current policy (METRIC_WEIGHTS).
     * @param {object} rawMetrics - Raw scores (assumed 0.0 to 1.0).
     * @returns {object} Weighted scores encapsulated as Trust Calculus Input factors.
     */
    _processAndWeighMetrics(rawMetrics) {

        // --- Trust Calculus Input Factors (Scores aggregated here):

        // Safety Factor: Pushes towards retirement (higher redundancy => higher score)
        const safetyFactor = rawMetrics.redundancyScore * METRIC_WEIGHTS.REDUNDANCY;

        // Overhead Factor: Pushes towards retirement (higher complexity reduction => higher score)
        const overheadFactor = rawMetrics.complexityReductionEstimate * METRIC_WEIGHTS.COMPLEXITY_REDUCTION;

        // Risk Factor: Pulls away from retirement (higher exposure => lower score).
        // Applied with a negative factor to represent drag/detraction from the overall retirement score.
        const riskFactorDetraction = rawMetrics.criticalDependencyExposure * METRIC_WEIGHTS.DEPENDENCY_EXPOSURE * -1;

        // Usage Penalty: Pushes towards retirement if usage is low.
        const usagePenalty = (1 - rawMetrics.usageRate) * METRIC_WEIGHTS.USAGE_RATE_PENALTY;

        // Composite Trust Calculus Input (CTC): Sum of weighted factors
        const trustCalculusInput = safetyFactor + overheadFactor + riskFactorDetraction + usagePenalty;

        return {
            raw: rawMetrics,
            adjudicationInput: {
                // Main normalized input for CORE's P-01 function
                trustCalculusInput: trustCalculusInput,

                // Detailed Weighted Factors for auditing and traceability
                safetyFactor: safetyFactor,
                riskFactor: riskFactorDetraction,
                overheadFactor: overheadFactor,
                usagePenalty: usagePenalty
            }
        };
    },

    /**
     * Gathers all necessary weighted data points for a retirement review.
     * @param {string} componentId - The component to analyze.
     * @returns {Promise<object>} Calculated and weighted metrics ready for CORE consumption.
     */
    async getComponentMetrics(componentId) {
        if (!componentId || typeof componentId !== 'string') {
            logger.error('Invalid componentId provided to RMS.', { componentId });
            throw new Error('RMS requires a valid component identifier.');
        }

        logger.info(`Orchestrating detailed retirement metrics calculation for ${componentId}.`);

        try {
            // Step 1: Fetch raw data (decoupled)
            const rawMetrics = await this._fetchRawMetrics(componentId);

            // Step 2: Apply normalization, weights, and calculate final composite score
            return this._processAndWeighMetrics(rawMetrics);

        } catch (error) {
            logger.error(`Critical failure in RMS orchestration for ${componentId}.`, error);
            throw new Error(`RMS Calculation Orchestration Failure: ${error.message}`);
        }
    }
};
