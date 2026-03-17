import { MPAMConfiguration, PolicyAdherenceResult } from '../types/MPAMTypes';

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
    private config: MPAMConfiguration;
    private readonly dataFetcher: IComplianceDataFetcher;

    constructor(mpamConfig: MPAMConfiguration, dataFetcher: IComplianceDataFetcher) {
        if (!dataFetcher) {
            throw new Error("IComplianceDataFetcher dependency missing.");
        }
        this.config = mpamConfig;
        this.dataFetcher = dataFetcher;
    }

    /**
     * Calculates the adherence score from raw data based on complex scoring rules.
     * @param policy - The policy definition.
     * @param rawData - The raw compliance data (e.g., API response).
     * @returns The normalized adherence score (0.0 to 1.0).
     */
    private calculateScore(policy: Policy, rawData: number): number {
        // Note: Complex, algorithm-specific logic (e.g., aggregating multiple metric sources,
        // normalization, temporal averaging) would reside here.
        // Currently, it returns the raw data value directly, assuming it's a score.
        return rawData;
    }

    /**
     * Determines if a calculated score meets any of the policy's required metrics thresholds.
     */
    private checkPolicyCompliance(policy: Policy, adherenceScore: number): boolean {
        return policy.metrics.some(metric => adherenceScore >= metric.target_threshold);
    }

    public async checkAdherence(): Promise<PolicyAdherenceResult[]> {
        const results: PolicyAdherenceResult[] = [];

        for (const policy of this.config.policies) {
            if (!policy.audit_config || policy.metrics.length === 0) continue;

            const endpoint = policy.audit_config.source_api;
            let rawData: number;
            
            try {
                rawData = await this.dataFetcher.fetchComplianceData(endpoint);
            } catch (error) {
                console.error(`Error fetching compliance data for ${policy.policy_id} from ${endpoint}:`, error);
                // Skip or mark as non-compliant due to inability to audit
                continue;
            }

            const adherenceScore = this.calculateScore(policy, rawData);
            const isCompliant = this.checkPolicyCompliance(policy, adherenceScore);
            
            // Find the lowest required threshold for reporting (useful for context, even if multiple metrics exist)
            const minRequiredThreshold = policy.metrics.reduce((min, metric) => 
                Math.min(min, metric.target_threshold), Infinity);

            results.push({
                policyId: policy.policy_id,
                isCompliant: isCompliant,
                score: adherenceScore,
                requiredThreshold: minRequiredThreshold !== Infinity ? minRequiredThreshold : 0,
                timestamp: new Date().toISOString()
            });
        }

        return results;
    }
}