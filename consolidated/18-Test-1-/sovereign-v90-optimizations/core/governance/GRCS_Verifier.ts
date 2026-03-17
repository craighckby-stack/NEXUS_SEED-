import {
    GRCSReport,
    VerificationResult,
    VerifierConfiguration,
    CertifiedUtilityMetrics,
    FailureProfile
} from './GRCS_VerificationTypes';

// NOTE: Implementation assumes necessary external services (CryptoEngine, PolicyService) are available/imported elsewhere.

/**
 * Interface for the required external threshold validation utility.
 */
interface IThresholdValidator {
    execute: (args: { 
        value: number, 
        ceiling: number, 
        unit: string, 
        allowedUnits: string[] 
    }) => { passed: boolean, reason: string };
}

/**
 * Default configuration constants for the Verifier, focusing on hard safety thresholds.
 * Rigorously deep-frozen to ensure immutability.
 */
const DEFAULT_CONFIG: VerifierConfiguration = Object.freeze({
    standardRiskCeiling: 500000, // Maximum allowed S02_Value for standard operational profiles (in LiabilityUnit).
});

/**
 * GRCS_Verifier (v94.2)
 * Utility responsible for verifying the integrity and policy adherence of a Governance Runtime Context Schema (GRCS) report.
 * Utilizes specific configurations for adaptive risk evaluation.
 */
export class GRCS_Verifier {
    // Use private static fields for strong encapsulation of configuration and dependencies.
    private static #config: VerifierConfiguration = DEFAULT_CONFIG;
    private static #validator: IThresholdValidator | null = null;

    /**
     * Extracts and enforces synchronous configuration preparation and freezing.
     */
    private static #setupConfiguration(customConfig: Partial<VerifierConfiguration>): void {
        // Merge configuration and immediately freeze the result for immutability.
        GRCS_Verifier.#config = Object.freeze({ ...DEFAULT_CONFIG, ...customConfig });
    }

    /**
     * Extracts dependency assignment logic.
     */
    private static #setupDependencies(validator?: IThresholdValidator): void {
        if (validator) {
            GRCS_Verifier.#validator = validator;
        }
    }

    /**
     * Ensures the required ThresholdValidator dependency is present before execution.
     */
    private static #ensureValidatorIsReady(): void {
        if (!GRCS_Verifier.#validator) {
            throw new Error("GRCS_Verifier Dependency Failure: ThresholdValidator not injected. Call configure() with the validator instance before use.");
        }
    }

    /**
     * Sets runtime configuration and injects the required ThresholdValidator utility.
     * NOTE: The validator *must* be injected via this method before calling verify().
     * 
     * @param customConfig Partial configuration object.
     * @param validator Optional injection of the required ThresholdValidator service.
     */
    public static configure(customConfig: Partial<VerifierConfiguration>, validator?: IThresholdValidator): void {
        GRCS_Verifier.#setupConfiguration(customConfig);
        GRCS_Verifier.#setupDependencies(validator);
    }

    /**
     * Executes the comprehensive three-phase verification process (CRoT, Policy, Risk).
     * Uses an optimized, short-circuiting loop to execute steps sequentially.
     * @param report The GRCS Report object.
     * @returns A detailed VerificationResult object.
     */
    public static async verify(report: GRCSReport): Promise<VerificationResult> {
        // Check dependency readiness using extracted helper.
        GRCS_Verifier.#ensureValidatorIsReady();

        const auditTrail: VerificationResult['auditTrail'] = [];

        // Define steps as an array of functions returning promises for sequential, short-circuit execution.
        // Steps 2 and 3 are synchronous, wrapped in Promise.resolve() for uniform iteration.
        const verificationSteps: Array<() => Promise<VerificationResult['auditTrail'][0]>> = [
            // Step 1: Cryptographic Integrity Verification (CRoT)
            () => this.verifyCRoT(report.CertifiedUtilityMetrics),
            
            // Step 2: Policy Compliance Check
            () => Promise.resolve(this.checkPolicyAdherence(report.PolicyReference, report.EstimatedFailureProfile)),
            
            // Step 3: Threshold and Consistency Checks (S02)
            () => Promise.resolve(this.checkRiskThreshold(report.EstimatedFailureProfile)),
        ];

        for (const stepExecutor of verificationSteps) {
            const entry = await stepExecutor();
            auditTrail.push(entry);

            if (!entry.success) {
                // Fail fast upon first verification failure
                return { passed: false, auditTrail };
            }
        }
        
        return { passed: true, auditTrail };
    }

    /**
     * Isolates the simulated I/O call to the external CRoT verification service.
     */
    private static async #delegateToCRoTService(): Promise<void> {
        // Simulate external service latency / I/O interaction with CryptoEngine.
        await new Promise(resolve => setTimeout(resolve, 5)); 
    }


    /**
     * Checks cryptographic proof of identity using CRoT signature.
     * (Placeholder simulating call to an external CryptoEngine service)
     */
    private static async verifyCRoT(metrics: CertifiedUtilityMetrics): Promise<VerificationResult['auditTrail'][0]> {
        if (!metrics.CRoT_Signature || metrics.CRoT_Signature.length < 32) {
             return { 
                step: 'CRoT_Signature', 
                success: false, 
                reason: 'Missing or malformed CRoT signature.' 
            };
        }
        
        // Delegate external interaction
        await GRCS_Verifier.#delegateToCRoTService(); 
        
        return { 
            step: 'CRoT_Signature', 
            success: true, 
            reason: 'CRoT Signature validated against S01 metrics.',
            details: metrics.MetricsSetID
        };
    }

    /**
     * Checks if the report adheres to its declared policy reference and tolerance limits defined within the report itself.
     * (This ensures the reported risk is within its self-declared bounds based on active policy configuration).
     */
    private static checkPolicyAdherence(policyId: string, profile: FailureProfile): VerificationResult['auditTrail'][0] {
        // Example check: All policies must conform to the mandated GRC-A standard.
        if (!policyId.startsWith('GRC-A')) {
            return {
                step: 'Policy_Adherence',
                success: false,
                reason: `Policy ID '${policyId}' is not an authorized Governance Runtime Context policy schema. `,
            };
        }

        // Check if the reported S02 risk exceeds the policy-mandated S02 tolerance limit (internal breach check).
        if (profile.S02_Value > profile.S02_Tolerance) {
            return {
                step: 'Policy_Adherence',
                success: false,
                reason: `Internal policy breach: S02_Value (${profile.S02_Value}) exceeds declared Policy Tolerance (${profile.S02_Tolerance}).`,
                details: `Policy ID: ${policyId}`
            };
        }

        return {
            step: 'Policy_Adherence',
            success: true,
            reason: `Report complies with active policy limits.`, 
        };
    }

    /**
     * Isolates the direct delegation and parameters used by the external ThresholdValidator.
     */
    private static #delegateToThresholdValidator(
        value: number, 
        ceiling: number, 
        unit: string
    ): { passed: boolean, reason: string } {
        // Validator existence is guaranteed by #ensureValidatorIsReady in verify().
        const validator = GRCS_Verifier.#validator!;
        const allowedUnits = ['USD', 'PPR']; // Standard GRCS defined units
        
        return validator.execute({
            value,
            ceiling,
            unit,
            allowedUnits
        });
    }

    /**
     * Checks if the operational risk (S02_Value) exceeds configurable system-wide risk ceilings (external operational check).
     */
    private static checkRiskThreshold(profile: FailureProfile): VerificationResult['auditTrail'][0] {
        const ceiling = GRCS_Verifier.#config.standardRiskCeiling;
        
        // Utilizing the I/O proxy for centralized limit checking.
        const validationResult = GRCS_Verifier.#delegateToThresholdValidator(
            profile.S02_Value,
            ceiling,
            profile.LiabilityUnit
        );
        // ----------------------------------------

        if (!validationResult.passed) {
            let finalReason = validationResult.reason;
            
            // Reformat generic plugin output into specific GRCS error messages for audit trail clarity.
            if (validationResult.reason.includes('Unsupported Unit')) {
                 finalReason = `Unsupported LiabilityUnit detected: ${profile.LiabilityUnit}. Cannot verify risk threshold against configured ceiling.`;
            } else if (validationResult.reason.includes('exceeds configured ceiling')) {
                 finalReason = `CRITICAL RISK: S02_Value (${profile.S02_Value} ${profile.LiabilityUnit}) exceeds operational ceiling of ${ceiling} ${profile.LiabilityUnit}.`;
            }
            
            return {
                step: 'Risk_Threshold',
                success: false,
                reason: finalReason,
                details: `Ceiling Source: ${GRCS_Verifier.#config === DEFAULT_CONFIG ? 'DEFAULT' : 'CUSTOM'}`
            };
        }

        return {
            step: 'Risk_Threshold',
            success: true,
            reason: `S02 Value is within the operational risk ceiling (${ceiling} ${profile.LiabilityUnit}).`,
        };
    }
}