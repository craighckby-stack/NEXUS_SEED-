// Component ID: PSR
// Mandate: Provide enhanced predictive stability data (Simulation Score) to the ATM (S-01 input)
// GSEP Role: EPDP B refinement step.

import { MutationPayload } from '../types/payloadTypes';
import { MicroSandbox } from '../execution/microSandbox';
import { 
    SimulationParameters, 
    SimulationReport, 
    TestResultMetrics 
} from '../types/simulationTypes'; 

/**
 * PreCommitSimulationRunner (PSR)
 * Executes the proposed mutation payload within an isolated, state-mirrored micro-sandbox.
 * Gathers resilience and performance metrics necessary for refining the S-01 Success Projection Score.
 * Implements adaptive scoring based on configured parameters.
 */
export class PreCommitSimulationRunner {
    private sandbox: MicroSandbox;

    constructor(sandbox: MicroSandbox) {
        this.sandbox = sandbox;
    }

    /**
     * Runs a rapid simulation test of the mutation with specific governance parameters.
     * @param payload The validated mutation specification.
     * @param params Configuration defining simulation constraints and intensity.
     * @returns A detailed predictive simulation report.
     */
    async runSimulation(
        payload: MutationPayload,
        params: SimulationParameters 
    ): Promise<SimulationReport> {
        let metrics: TestResultMetrics | null = null;
        let finalStatus: 'SUCCESS' | 'FAILURE' | 'ROLLBACK_FAILURE' = 'FAILURE';
        let failureVector: string | null = null;
        let score = 0.0;
        
        // 1. Snapshot critical state variables for the micro-sandbox.
        const snapshot = await this.sandbox.takeSnapshot();

        try {
            // 2. Execute the mutation in the isolated environment.
            await this.sandbox.applyMutation(payload);

            // 3. Run resilience and synthetic stress tests post-mutation, passing config.
            // NOTE: MicroSandbox.runStressTests must accept SimulationParameters.
            metrics = await this.sandbox.runStressTests(params); 

            // 4. Calculate a predictive score based on test resilience, performance, and required targets.
            score = this.calculateScore(metrics, params);
            finalStatus = 'SUCCESS';

        } catch (error) {
            failureVector = error instanceof Error ? error.message : String(error);
            score = 0.05; // Immediate simulation crash yields near-zero score.
        } finally {
            // 5. Mandatory state rollback in the micro-sandbox.
            try {
                await this.sandbox.restoreSnapshot(snapshot);
            } catch (rollbackError) {
                // If rollback fails, the PSR state is compromised, critical failure.
                finalStatus = 'ROLLBACK_FAILURE';
                failureVector = failureVector 
                    ? `${failureVector} | Rollback Failure: ${rollbackError.message}` 
                    : `Rollback Failure: ${rollbackError.message}`;
                score = 0.0; // Absolute failure score.
            }
        }

        // 6. Construct and return the comprehensive report.
        const defaultMetrics: TestResultMetrics = { 
            totalTests: 0, passedTests: 0, passRate: 0, 
            initialPerformanceMetric: 0, postMutationPerformanceMetric: 0, 
            performanceDelta: 1.0, resourceCeilingProximity: 0.0 
        };

        return {
            timestamp: Date.now(),
            simulationScore: score,
            status: finalStatus,
            metrics: metrics || defaultMetrics,
            failureVector: failureVector
        };
    }

    /**
     * Predictive scoring logic utilizing multi-dimensional input metrics and simulation parameters.
     * Introduces explicit weights and performance penalties relative to configuration targets.
     */
    private calculateScore(metrics: TestResultMetrics, params: SimulationParameters): number {
        const { passRate, performanceDelta, resourceCeilingProximity } = metrics;
        const { targetLatencyDelta, requiredPassRate } = params;

        // Weights must sum close to 1.0 (1.00)
        const W_PASS = 0.50; 
        const W_PERF = 0.35; 
        const W_RESOURCE = 0.15;
        
        // 1. Pass Rate Contribution: Normalized against minimum requirement.
        const passContribution = Math.min(1.0, passRate / requiredPassRate) * W_PASS;

        // 2. Performance Contribution: Penalty for exceeding target latency.
        const acceptableFactor = 1 + targetLatencyDelta; // E.g., 1.05 for 5% slowdown tolerance.
        
        // Perf Ratio aggressively penalizes deviations beyond tolerance (using a 2x multiplier).
        const perfRatio = Math.max(0, 1 - ((performanceDelta - acceptableFactor) * 2)); 
        const perfContribution = perfRatio * W_PERF;


        // 3. Resource Contribution: Penalty for proximity to execution ceiling.
        const ceilingPenalty = resourceCeilingProximity > 0.8 
            ? Math.pow(resourceCeilingProximity, 3) // Cubic penalty for high usage
            : 0;

        const resourceContribution = Math.max(0, (1 - ceilingPenalty)) * W_RESOURCE;
        
        const rawScore = passContribution + perfContribution + resourceContribution;

        // Ensure score is clamped [0.0, 1.0]
        return Math.min(1.0, Math.max(0.0, rawScore));
    }
}