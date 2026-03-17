from typing import Dict, Any, TypedDict

# --- APRE Data Structure Definitions for Type Safety ---

class StabilityBounds(TypedDict):
    min_epsilon: float
    max_epsilon: float
    required_fields: list[str]

class ACVDConfig(TypedDict):
    """Axiomatic Constraint Vector Definition"""
    version: str
    stability_bounds: StabilityBounds
    security_flags: list[str]

class PCSSData(TypedDict):
    """Policy Correction Safety Schema"""
    id: str
    correction_type: str
    params: Dict[str, Any]
    status: str
