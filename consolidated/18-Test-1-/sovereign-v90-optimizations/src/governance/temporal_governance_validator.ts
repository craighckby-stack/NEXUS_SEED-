import { PESMSchema } from "./policy_evolution_schema";
import { VetoTriggerEvaluationKernel } from "@kernel/VetoTriggerEvaluationKernel";
import { GovernanceSettingsRegistryKernel } from "@registry/GovernanceSettingsRegistryKernel";

/**
 * Define the key used to retrieve the Veto Duration from Governance Settings.
 * This prevents hardcoding temporal constants.
 */
const GOVERNANCE_KEY_VETO_DURATION = 'temporal.vetoDurationMs';

/**
 * The TemporalGovernanceValidatorKernel enforces the High-Integrity Lifecycle (HIL-T) 
 * Veto Check period asynchronously using specialized Tool Kernels.
 */
export class TemporalGovernanceValidatorKernel {
    private vetoDurationMs: number = 0;

    /**
     * @param vetoEvaluator Kernel responsible for high-integrity temporal checks.
     * @param settingsRegistry Kernel for retrieving secure governance parameters.
     */
    constructor(
        private readonly vetoEvaluator: VetoTriggerEvaluationKernel,
        private readonly settingsRegistry: GovernanceSettingsRegistryKernel
    ) {}

    /**
     * Ensures the Kernel is fully configured by fetching required parameters asynchronously.
     */
    public async initialize(): Promise<void> {
        // Fetch the mandatory veto duration from the secure registry
        const duration = await this.settingsRegistry.getSetting(GOVERNANCE_KEY_VETO_DURATION);
        
        if (typeof duration !== 'number' || duration <= 0) {
             throw new Error(`[TemporalGovernanceValidatorKernel] Initialization failure: Could not retrieve valid veto duration for key: ${GOVERNANCE_KEY_VETO_DURATION}`);
        }
        
        this.vetoDurationMs = duration;
    }

    /**
     * Ensures the veto window integrity and verifies that the current time has passed 
     * this window if finalization is requested.
     * @param manifest The policy evolution manifest object.
     * @param requestFinalization True if checking for S0 integration readiness (i.e., window must be passed).
     * @returns Promise<boolean> True if validation passes.
     * @throws Error if temporal integrity fails or the veto window is still active during finalization.
     */
    public async validate(manifest: PESMSchema, requestFinalization: boolean = false): Promise<boolean> {
        if (this.vetoDurationMs === 0) {
            throw new Error("[TemporalGovernanceValidatorKernel] Kernel not initialized. Call initialize() first.");
        }

        const { stagingMetadata } = manifest;

        const evaluationContext = {
            stagingTimestamp: stagingMetadata.stagingTimestamp,
            vetoWindowEnd: stagingMetadata.vetoWindowEnd, // Allows the tool to calculate or verify
            durationMs: this.vetoDurationMs,
            checkExpiration: requestFinalization, // Check if the window is passed
            toleranceMs: 1000 // 1 second margin for clock drift tolerance
        };
        
        // Delegation to the specialized, asynchronous VetoTriggerEvaluationKernel
        const result = await this.vetoEvaluator.evaluateProposalTemporalIntegrity(evaluationContext);

        if (result.error) {
            // The evaluator handles low-level temporal data integrity issues
            throw new Error(`PESM Temporal Integrity Error: ${result.error}`);
        }
        
        // Domain-specific enforcement logic: HIL-T Veto Check
        if (requestFinalization && !result.isVetoWindowExpired) {
            const remainingHours = (result.remainingDurationMs || 0) / (60 * 60 * 1000);
            const formattedHours = remainingHours.toFixed(2);
            
            throw new Error(`Deployment blocked. Mandatory HIL-T Veto Check period still active. Remaining: ${formattedHours} hours.`);
        }
        
        return true;
    }
}