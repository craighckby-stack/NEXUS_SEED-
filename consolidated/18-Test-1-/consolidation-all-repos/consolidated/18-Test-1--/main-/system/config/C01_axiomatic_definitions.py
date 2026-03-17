# C01_AXIOMATIC_DEFINITIONS.PY
# Centralized policy and definition file for system calculus engines.

from typing import Dict

# --- METRIC THRESHOLDS AND SCALES ---

# ACVD (Axiomatic Confidence Validation Degree) Threshold. 
# Minimum required TEMM (Temporal Execution Merit Metric) for successful P-01 execution.
ACVD_THRESHOLD_DEFAULT: float = 90.0

# --- P-01 HALT REASON PRIORITY CODES (HRPC) ---

# These definitions are used by P01_calculus_engine to ensure standardized reporting.
HALT_REASONS_PRIORITIZED: Dict[str, str] = {
    "PVLM": "HRPC-1: Pre-Validation Logic Miss (System Integrity Failure)",
    "ECVM": "HRPC-2: Execution Context Verification Metric (False) (Context/Environment Failure)",
    "MPAM": "HRPC-3: Manifest Policy Axiom Miss (Policy Non-compliance)",
    "ADTM": "HRPC-4: Axiomatic Deviation Threshold Miss (Runtime Anomaly)",
    "P01_FAIL_TEMM": "HRPC-5: P-01 Axiom I Failure (Utility Maximization Attestation Miss)"
}

# NOTE: When refactoring the calculus engine, these constants should be imported 
# to ensure consistency across the Sovereign AGI stack.
