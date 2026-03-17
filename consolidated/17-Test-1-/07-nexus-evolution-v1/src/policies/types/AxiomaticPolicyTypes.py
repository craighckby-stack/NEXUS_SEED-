from typing import Dict, Any, TypedDict

# Defines the structure for stability-related constraints within the ACVD
class StabilityBounds(TypedDict):
    min_epsilon: float
    max_epsilon: float
    required_fields: list[str]

# Defines the overarching Axiomatic Constraint Vector Definition (ACVD) structure
class ACVDConfig(TypedDict):
    version: str
    stability_bounds: StabilityBounds
    security_flags: list[str]
    # Add definitions for other constraint types (e.g., ResourceLimits, TrustMetrics)

# Defines the proposed Policy Correction Safety Schema (PCSS) payload
class PCSSData(TypedDict):
    id: str
    correction_type: str  # e.g., 'stability_reweight', 'resource_ceiling_adjustment'
    params: Dict[str, Any] # Parameters required for the specific correction_type
    status: str # e.g., 'PROPOSED', 'VALIDATED'
