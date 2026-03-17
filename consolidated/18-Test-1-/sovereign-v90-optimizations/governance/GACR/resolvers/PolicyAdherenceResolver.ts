import { MPAMConfiguration, PolicyAdherenceResult } from '../types/MPAMTypes';
import { IPolicyThresholdValidator, ThresholdValidationResult } from '../plugins/PolicyThresholdValidator';

/**
 * Interface for the external data fetching dependency.
 * This allows PolicyAdherenceResolver to focus purely on policy logic and simplifies testing.
 */
export interface IComplianceDataFetcher {
    fetchComplianceData(endpoint: string): Promise<number>;
}

// Type definition for convenience, assuming Policy structure within MPAMConfiguration
type Policy = MPAMConfiguration['policies'][0];

/**
 * PolicyAdherenceResolver: Loads the MPAM configuration and calculates adherence status 
 * by using an injected data service to retrieve compliance metrics against defined policies.
 */
export class PolicyAdherenceResolver {
    #config: MPAMConfiguration;
    #dataFetcher: IComplianceDataFetcher;
    #thresholdValidator: IPolicyThresholdValidator;

    constructor(
        mpamConfig: MPAMConfiguration, 
        dataFetcher: IComplianceDataFetcher,
        thresholdValidator: IPolicyThresholdValidator
    ) {
        this.#setupDependencies(mpamConfig, dataFetcher, thresholdValidator);
    }

    /**
     * Extracts synchronous dependency setup and input validation from the constructor.
     */
    #setupDependencies(
        mpamConfig: MPAMConfiguration, 
        dataFetcher: IComplianceDataFetcher,
        thresholdValidator: IPolicyThresholdValidator
    ): void {
        if (!dataFetcher || !thresholdValidator) {
            throw new Error("Missing required dependency: IComplianceDataFetcher or IPolicyThresholdValidator.");
        }
        this.#config = mpamConfig;
        this.#dataFetcher = dataFetcher;
        this.#thresholdValidator = thresholdValidator;
    }

    /**
     * Internal Helper: Calculates the adherence score from raw data based on complex scoring rules.
     * @param policy - The policy definition.
     * @param rawData - The raw compliance data (e.g., API response).
     * @returns The normalized adherence score (0.0 to 1.0).
     */
    #calculateScore(policy: Policy, rawData: number): number {
        // Note: Complex, algorithm-specific logic (e.g., aggregating multiple metric sources,
        // normalization, temporal averaging) would reside here.
        // Currently, it returns the raw data value directly, assuming it's a score.
        return rawData;
    }

    /** I/O Proxy: Delegates data fetching to the external service. */
    async #delegateToDataFetch(endpoint: string): Promise<number> {
        return this.#dataFetcher.fetchComplianceData(endpoint);
    }

    /** I/O Proxy: Delegates threshold validation to the external plugin. */
    #delegateToThresholdValidation(score: number, metrics: Policy['metrics']): ThresholdValidationResult {
        return this.#thresholdValidator.validate(score, metrics);
    }

    /** I/O Proxy: Delegates error logging to the console. */
    #logError(message: string, error: unknown): void {
        console.error(message, error);
    }

    public async checkAdherence(): Promise<PolicyAdherenceResult[]> {
        const results: PolicyAdherenceResult[] = [];

        for (const policy of this.#config.policies) {
            if (!policy.audit_config || policy.metrics.length === 0) continue;

            const endpoint = policy.audit_config.source_api;
            let rawData: number;
            
            try {
                rawData = await this.#delegateToDataFetch(endpoint);
            } catch (error) {
                this.#logError(`Error fetching compliance data for ${policy.policy_id} from ${endpoint}:`, error);
                // Skip or mark as non-compliant due to inability to audit
                continue;
            }

            const adherenceScore = this.#calculateScore(policy, rawData);
            
            // Compliance Check delegated via proxy
            const validationResult: ThresholdValidationResult = this.#delegateToThresholdValidation(
                adherenceScore,
                policy.metrics
            );

            results.push({
                policyId: policy.policy_id,
                isCompliant: validationResult.isCompliant,
                score: adherenceScore,
                requiredThreshold: validationResult.requiredReportingThreshold,
                timestamp: new Date().toISOString()
            });
        }

        return results;
    }
}