from typing import Dict
from src.core.CBM import ComputationalLimits

# --- Default Configurations for Computational Boundedness Module (CBM) ---

# Default limits for a standard operational environment (L2 Safety)
STANDARD_CBM_LIMITS: ComputationalLimits = {
    # Maximum allowed serialization size (proxy for transfer/parse cost)
    'max_size_bytes': 20480,  # 20 KB limit
    
    # Maximum estimated depth (proxy for recursion/chain length)
    'max_depth_heuristic': 5, 
    
    # Normalized budget score derived from log(size) * depth * 0.1
    'turing_budget': 1.5 
}

# Restricted/Low-Resource Environment Limits (L3 Safety)
RESTRICTED_CBM_LIMITS: ComputationalLimits = {
    'max_size_bytes': 5120, # 5 KB limit
    'max_depth_heuristic': 3, 
    'turing_budget': 0.8
}

def get_cbm_limits(env_mode: str) -> ComputationalLimits:
    """Retrieves CBM limits based on the current environment mode."""
    mode = env_mode.upper()
    if mode == 'RESTRICTED':
        return RESTRICTED_CBM_LIMITS
    # Default to standard limits
    return STANDARD_CBM_LIMITS
