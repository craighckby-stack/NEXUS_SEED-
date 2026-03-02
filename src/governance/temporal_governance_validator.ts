import { PESMSchema } from './policy_evolution_schema';

/**
 * Validates the temporal requirements defined in the PESM schema, 
 * specifically enforcing the HIL-T Veto Check period.
 */
export class TemporalGovernanceValidator {
    private static readonly VETO_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours

    /**
     * Ensures the vetoWindowEnd is correctly set based on stagingTimestamp and verifies
     * that the current time has passed this window if finalization is requested.
     * @param manifest The policy evolution manifest object.
     * @param requestFinalization True if checking for S0 integration readiness.
     */
    public validate(manifest: PESMSchema, requestFinalization: boolean = false): boolean | Error {
        const { stagingMetadata } = manifest;
        const stagingTime = new Date(stagingMetadata.stagingTimestamp).getTime();
        const intendedVetoEnd = stagingTime + TemporalGovernanceValidator.VETO_DURATION_MS;
        const providedVetoEnd = new Date(stagingMetadata.vetoWindowEnd).getTime();

        // 1. Check Veto Window Calculation Integrity
        if (Math.abs(intendedVetoEnd - providedVetoEnd) > 1000) { // Allow 1s clock drift margin
            throw new Error("PESM Integrity Failure: Provided 'vetoWindowEnd' does not accurately reflect 72 hours from 'stagingTimestamp'.");
        }

        // 2. Check Finalization Readiness
        if (requestFinalization) {
            const currentTime = Date.now();
            if (currentTime < providedVetoEnd) {
                const remaining = (providedVetoEnd - currentTime) / 3600000;
                throw new Error(`Deployment blocked. Mandatory HIL-T Veto Check period still active. Remaining: ${remaining.toFixed(2)} hours.`);
            }
        }

        return true;
    }
}