/**
 * GovernanceConstants (G-03)
 * Purpose: Defines centralized constants for AGI governance interaction,
 * standardizing the dialect for failure states and remediation mandates.
 * Used primarily by F-01 (FSAE) and Stage 2 (Proposal Generator).
 */

export const FAILURE_STAGES = {
    P01_TRUST_CALCULUS: 'EPDP C: P-01', // Trust Calculus Stage Failure
    M02_R_INDEX_READINESS: 'EPDP B: R-INDEX', // Readiness Index Failure
    S02_DEPENDENCY_CHECK: 'Stage 2: Dependency Pre-Check',
    UNCATEGORIZED: 'UNCATEGORIZED_FAILURE'
};

export const MANDATE_TYPES = {
    // Corrective Actions for Trust Calculus Failures
    POLICY_RESOLUTION: 'POLICY_RESOLUTION', 
    INCREASE_COVERAGE: 'INCREASE_COVERAGE', // Must add unit tests/simulations, requires delta/component
    SCOPE_REDUCTION: 'SCOPE_REDUCTION',     // Proposal too broad, requires target component reduction

    // Corrective Actions for Readiness Failures
    STABILITY_FOCUS: 'STABILITY_FOCUS',     // Target failed component invariants, requires component list
    DEPENDENCY_ISOLATION: 'DEPENDENCY_ISOLATION', 
    RESOURCE_AUDIT: 'RESOURCE_AUDIT'       // Re-evaluate resource consumption
};

export const DEFAULT_RETRY_TARGET = {
    BASE: 0.75,
    VETO: 0.98, 
    R_INDEX_BOOST: 0.85
};
