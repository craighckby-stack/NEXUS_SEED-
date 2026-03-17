from typing import TypedDict, Final

# --- Unit Abstraction and Computational Efficiency ---
# Pre-calculated, resolved constant definition for 1 MiB (1024 * 1024 bytes).
# Using the literal value (1048576) maximizes load-time efficiency by avoiding
# even trivial interpreter multiplication/folding steps at startup.
_CBM_UNIT_MIB: Final[int] = 1048576 


# --- Recursive Abstraction: Defining Constraint Dimensions ---
class CBMLimits(TypedDict, total=True):
    """
    Defines the dimensions of the Computational Boundedness Limits (CBM).
    These metrics establish resource ceilings (resource-space dimensions) 
    for Self-Stabilizing Tasks (SSTs).
    """
    # Normalized Constraint Dimension (Complexity/Resource allocation ratio)
    complexity_budget: float       
    
    # Structural Constraint Dimension (Maximum data volume)
    max_size_bytes: int            

    # Algorithmic Constraint Dimensions (Execution flow estimates)
    max_estimated_depth: int       
    max_required_tokens: int       


# --------------------------------------------------------------------------
# CBM_DEFAULT_LIMITS
# Tier-1 defaults optimized for minimal resource footprint and stability.
# --------------------------------------------------------------------------

CBM_DEFAULT_LIMITS: Final[CBMLimits] = {
    "complexity_budget": 0.85,       
    "max_size_bytes": _CBM_UNIT_MIB, 
    "max_estimated_depth": 7,        
    "max_required_tokens": 50000     
}