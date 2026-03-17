from typing import TypedDict, Any

# --- APRE Data Structure Definitions for Type Safety ---

class StabilityBounds(TypedDict):
    """Defines the acceptable bounds for stability metrics (epsilon)."""
    min_epsilon: float
    max_epsilon: float
    required_fields: list[str]

class ACVDConfig(TypedDict):
    """Axiomatic Constraint Vector Definition configuration."""
    version: str
    stability_bounds: StabilityBounds
    security_flags: list[str]

class PCSSData(TypedDict):
    """Policy Correction Safety Schema structure for correction events."""
    id: str
    correction_type: str
    params: dict[str, Any]  # Normalized to built-in dict
    status: str

class ConstraintHandlerDefinition(TypedDict):
    """Defines the processing logic and reaction methodology for a specific APRE constraint."""
    constraint_id: str
    severity_level: int # 1=Informational, 5=Critical
    default_correction_method: str # e.g., 'throttle', 'rollback', 'isolate'
    fallback_pcss_id: str # ID referencing a mandated PCSS action