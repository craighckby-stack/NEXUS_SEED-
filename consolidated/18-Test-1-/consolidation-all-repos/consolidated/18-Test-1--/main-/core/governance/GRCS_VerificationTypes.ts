/**
 * Defines strong types used across the GRCS Verification component suite.
 */

export interface FailureProfile {
    S02_Value: number; // Current calculated risk value (e.g., projected monetary liability or failure probability).
    S02_Tolerance: number; // The maximum tolerance limit derived from the active policy definition (must be >= S02_Value).
    LiabilityUnit: 'USD' | 'EUR' | 'PPR' | 'Unknown'; // Unit of liability (PPR = Probability Percent).
}

export interface CertifiedUtilityMetrics {
    MetricsSetID: string;
    CRoT_Signature: string; // Cryptographic Root of Trust Signature
    S01_Telemetry: string; // Core immutable telemetry used for hashing
}

export interface GRCSReport {
    ReportID: string;
    Timestamp: string;
    PolicyReference: string;
    CertifiedUtilityMetrics: CertifiedUtilityMetrics;
    EstimatedFailureProfile: FailureProfile;
    SourceEntityID: string;
}

export interface VerificationAuditEntry {
    step: 'CRoT_Signature' | 'Policy_Adherence' | 'Risk_Threshold';
    success: boolean;
    reason: string;
    details?: string;
}

export interface VerificationResult {
    passed: boolean;
    auditTrail: VerificationAuditEntry[];
}

export interface VerifierConfiguration {
    standardRiskCeiling: number; // The system-mandated global maximum risk tolerance for standard operations (in LiabilityUnit).
}