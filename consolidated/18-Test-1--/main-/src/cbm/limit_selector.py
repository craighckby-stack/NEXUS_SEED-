from typing import Literal, Final
from src.config.cbm_defaults import CBMLimits, CBM_DEFAULT_LIMITS, _MB

# Define context types. These mirror expected operational modes/task priorities.
CBMContext = Literal["DEFAULT", "CORE_AGENT", "EXPERIMENTAL", "DEBUG"]

# A central registry for various Computational Boundedness Limit profiles.
# This allows for context-dependent resource allocation.
CBM_PROFILE_REGISTRY: Final[dict[CBMContext, CBMLimits]] = {
    "DEFAULT": CBM_DEFAULT_LIMITS,
    "CORE_AGENT": {
        **CBM_DEFAULT_LIMITS,
        "complexity_budget": 0.95,      # Higher budget for mission-critical tasks
        "max_required_tokens": 100000,  # Double token limit
    },
    "EXPERIMENTAL": {
        **CBM_DEFAULT_LIMITS,
        "max_size_bytes": 2 * _MB,      # 2 MiB limit for larger experimental manifests
        "max_estimated_depth": 10,
    },
    "DEBUG": CBM_DEFAULT_LIMITS, # Use defaults for simple debug tasks
}

def get_limits(context: CBMContext = "DEFAULT") -> CBMLimits:
    """
    Retrieves the Computational Boundedness Limits based on the current operational context.
    
    :param context: The designated tier/profile (e.g., CORE_AGENT, EXPERIMENTAL).
    :return: The corresponding CBMLimits TypedDict.
    :raises ValueError: If an unknown context is requested.
    """
    if context in CBM_PROFILE_REGISTRY:
        return CBM_PROFILE_REGISTRY[context]
    
    # Fallback to default if a custom context is misconfigured, but raise a warning or error
    raise ValueError(f"Unknown CBM Context Profile requested: {context}")
