from typing import TypedDict, Final

# --- Helper Constants for Computational Size --- 
# Standard Mebibyte (MiB) convention used for size limits.
_MB: Final[int] = 1024 * 1024  

# --- Typed Definitions for CBM Limits ---
class CBMLimits(TypedDict, total=True):
    """
    Defines the strict structure and expected types for the Computational Boundedness Limits (CBM).
    These metrics establish resource ceilings for Self-Stabilizing Tasks (SSTs).
    """
    # Performance & Complexity Metrics (float 0.0 to 1.0)
    complexity_budget: float       
    
    # Structural Size Limits (bytes/int)
    max_size_bytes: int            

    # Execution Flow & Token Consumption Limits (Static Estimates - int)
    max_estimated_depth: int       
    max_required_tokens: int       


# --------------------------------------------------------------------------
# CBM_DEFAULT_LIMITS
# Tier-1 defaults for maximum estimated resources an SST can require.
# (Calibrated against S-02 risk mitigation targets).
# --------------------------------------------------------------------------

CBM_DEFAULT_LIMITS: Final[CBMLimits] = {
    # General Complexity Metrics
    "complexity_budget": 0.85,       # Maximum normalized complexity_score allowed (0.0 to 1.0)
    
    # Structural Size Limits
    "max_size_bytes": 1 * _MB,       # 1 MiB Maximum raw byte size of the SST manifest

    # Execution Flow Limits (Static Estimates)
    "max_estimated_depth": 7,        # Maximum estimated recursive or logical execution depth
    "max_required_tokens": 50000     # Estimated maximum number of high-level instruction tokens
}