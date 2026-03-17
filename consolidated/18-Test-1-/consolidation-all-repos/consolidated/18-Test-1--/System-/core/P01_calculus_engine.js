/**
 * P01_CALCULUS_ENGINE.JS
 * Core module for calculating the P-01 PASS/FAIL atomic decision and determining Integrity Halt reasons.
 */

// Standardized Halt Reason Priority Codes (HRPC) for failure traceability and rapid diagnostics.
const HALT_REASONS = {
    PVLM: "HRPC-1: Pre-Validation Logic Miss (System Integrity Failure)",
    ECVM: "HRPC-2: Execution Context Verification Metric (False) (Context/Environment Failure)",
    MPAM: "HRPC-3: Manifest Policy Axiom Miss (Policy Non-compliance)",
    ADTM: "HRPC-4: Axiomatic Deviation Threshold Miss (Runtime Anomaly)",
    P01_FAIL_TEMM: "HRPC-5: P-01 Axiom I Failure (Utility Maximization Attestation Miss)"
};

/**
 * Calculates the P-01 PASS/FAIL atomic decision based on input metrics and flags.
 * Determines the necessity and prioritized reason for an Integrity Halt (IH).
 * @param {number} temm - Total Evolutionary Metric Measurement.
 * @param {number} acvd_threshold - Activation Threshold derived from ACVD (UFRM + CFTM).
 * @param {boolean} ecvm - Execution Context Verification Metric.
 * @param {boolean} pvlm - Pre-Validation Logic Miss flag.
 * @param {boolean} mpam - Manifest Policy Axiom Miss flag.
 * @param {boolean} adtm - Axiomatic Deviation Threshold Miss flag.
 * @returns {{P01_PASS: boolean, Axiom_I_UMA: boolean, Axiom_II_CA: boolean, Axiom_III_AI: boolean, INTEGRITY_HALT: boolean, HALT_REASON: string}}
 */
function evaluateP01Finality(
    temm,
    acvd_threshold,
    ecvm,
    pvlm,
    mpam,
    adtm
) {
    // --- 1. Axiomatic Validation ---

    // Axiom I (UMA): Utility Maximization Attestation
    const axiom_i_pass = temm >= acvd_threshold;

    // Axiom II (CA): Context Attestation
    const axiom_ii_pass = ecvm;

    // Axiom III (AI): Axiomatic Integrity Validation (Absence of internal veto flags)
    const axiom_iii_pass = !(pvlm || mpam || adtm);

    // P-01 Finalization Calculation (S11): All axioms must pass.
    const p01_pass = axiom_i_pass && axiom_ii_pass && axiom_iii_pass;

    // --- 2. Integrity Halt Determination ---

    // In the P-01 calculus, any failure implies an Integrity Halt.
    const integrity_halt = !p01_pass;
    let halt_reason = "NONE";

    if (integrity_halt) {
        // Prioritized halt cause determination based on HRPC severity (HRPC-1 is highest).
        if (pvlm) {
            halt_reason = HALT_REASONS.PVLM;
        } else if (!ecvm) {
            halt_reason = HALT_REASONS.ECVM;
        } else if (mpam) {
            halt_reason = HALT_REASONS.MPAM;
        } else if (adtm) {
            halt_reason = HALT_REASONS.ADTM;
        } else {
            // If Axioms II and III did not trigger the halt, the cause must be Axiom I failure (TEMM miss).
            halt_reason = HALT_REASONS.P01_FAIL_TEMM;
        }
    }

    // --- 3. Result Compilation ---

    return {
        P01_PASS: p01_pass,
        Axiom_I_UMA: axiom_i_pass,
        Axiom_II_CA: axiom_ii_pass,
        Axiom_III_AI: axiom_iii_pass,
        INTEGRITY_HALT: integrity_halt,
        HALT_REASON: halt_reason
    };
}

export {
    HALT_REASONS,
    evaluateP01Finality
};
