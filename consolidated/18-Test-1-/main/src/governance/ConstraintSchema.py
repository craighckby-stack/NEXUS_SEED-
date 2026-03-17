from pydantic import BaseModel, Field
from typing import Dict
from .ConstraintKeys import ConstraintKey

class ConstraintDefinition(BaseModel):
    """Defines the static metadata and configuration limits for a single constraint component.
    This structure ensures consistent governance configuration across AEC cycles.
    """
    
    description: str = Field(..., description="Human-readable explanation of the constraint.")
    default_weight: float = Field(..., ge=0.0, le=1.0, description="Default weight applied in the S-04 aggregate calculation.")
    critical_threshold: float = Field(..., description="The score (normalized 0-1) above which this constraint is flagged as critical.")


ConstraintSchema = Dict[ConstraintKey, ConstraintDefinition]

DEFAULT_CONSTRAINTS: ConstraintSchema = {
    ConstraintKey.COUPLING_PENALTY: ConstraintDefinition(
        description="Penalty score based on excessive inter-module coupling leading to architectural fragility.",
        default_weight=0.35,
        critical_threshold=0.8,
    ),
    ConstraintKey.RESOURCE_DEBT: ConstraintDefinition(
        description="Metric tracking wasted computational resources due to sub-optimal algorithm or execution path.",
        default_weight=0.45,
        critical_threshold=0.6,
    ),
    ConstraintKey.POLICY_DEVIATION: ConstraintDefinition(
        description="Penalty for divergence from established Sovereign AGI ethical or safety policies.",
        default_weight=0.20,
        critical_threshold=1.0,
    )
}