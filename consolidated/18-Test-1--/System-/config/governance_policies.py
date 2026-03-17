# Governance Policies for System Integrity and Runtime Behavior

# --- IH Sentinel Policies ---

# List of critical axiomatic failure flags (PVLM, MPAM, ADTM, etc.)
# If any of these are asserted by an upstream agent (S00-S14), an immediate
# Integrity Halt and Rollback are mandatory.
SENTINEL_CRITICAL_FLAGS = [
    'PVLM',  # Policy Violation Logic Mismatch
    'MPAM',  # Memory Pointer Allocation Malfunction
    'ADTM'   # Axiomatic Data Temporal Misalignment
]

# Note: This file must be treated as immutable runtime policy by consuming modules.