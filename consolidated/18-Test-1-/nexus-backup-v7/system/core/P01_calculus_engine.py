# P01_CALCULUS_ENGINE.PY

from typing import Dict, Union

# NOTE: ACVD_THRESHOLD represents the minimum TEMM required, derived from ACVD (UFRM + CFTM)

# Standardized Halt Reason Priority Codes (HRPC) for failure traceability and rapid diagnostics.
HALT_REASONS = {
    "PVLM": "HRPC-1: Pre-Validation Logic Miss (System Integrity Failure)",
    "ECVM": "HRPC-2: Execution Context Verification Metric (False) (Context/Environment Failure)",
    "MPAM": "HRPC-3: Manifest Policy Axiom Miss (Policy Non-compliance)",
    "ADTM": "HRPC-4: Axiomatic Deviation Threshold Miss (Runtime Anomaly)",
    "P01_FAIL_TEMM": "HRPC-5: P-01 Axiom I Failure (Utility Maximization Attestation Miss)"
}

def evaluate_p01_finality(
    temm: float,
    acvd_threshold: float,
    ecvm: bool,
    pvlm: bool,
    mpam: bool,
    adtm: bool
) -> Dict[str, Union[bool, str]]:
    """Calculates the P-01 PASS/FAIL atomic decision based on input metrics and flags.
       Determines the necessity and prioritized reason for an Integrity Halt (IH).
    """

    # --- 1. Axiomatic Validation ---
    
    # Axiom I (UMA): Utility Maximization Attestation
    axiom_i_pass = temm >= acvd_threshold
    
    # Axiom II (CA): Context Attestation
    axiom_ii_pass = ecvm
    
    # Axiom III (AI): Axiomatic Integrity Validation (Absence of internal veto flags)
    axiom_iii_pass = not (pvlm or mpam or adtm)

    # P-01 Finalization Calculation (S11): All axioms must pass.
    p01_pass = axiom_i_pass and axiom_ii_pass and axiom_iii_pass
    
    # --- 2. Integrity Halt Determination ---
    
    # In the P-01 calculus, any failure implies an Integrity Halt.
    integrity_halt = not p01_pass
    halt_reason = "NONE"
    
    if integrity_halt:
        # Prioritized halt cause determination based on HRPC severity.
        if pvlm:
            halt_reason = HALT_REASONS["PVLM"]
        elif not ecvm:
            halt_reason = HALT_REASONS["ECVM"]
        elif mpam:
            halt_reason = HALT_REASONS["MPAM"]
        elif adtm:
            halt_reason = HALT_REASONS["ADTM"]
        else:
            # If Axioms II and III did not trigger the halt, the cause must be Axiom I failure.
            halt_reason = HALT_REASONS["P01_FAIL_TEMM"]
        
    # --- 3. Result Compilation ---

    return {
        "P01_PASS": p01_pass,
        "Axiom_I_UMA": axiom_i_pass,
        "Axiom_II_CA": axiom_ii_pass,
        "Axiom_III_AI": axiom_iii_pass,
        "INTEGRITY_HALT": integrity_halt,
        "HALT_REASON": halt_reason
    }
