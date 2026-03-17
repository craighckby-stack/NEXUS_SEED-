from pydantic import BaseModel, Field, conlist, NonNegativeFloat, UUID4
from typing import Optional, Literal

# NOTE: This module enforces runtime validation using Pydantic, ensuring
# cross-daemon communication conforms strictly to the schema definitions.

ProposalProtocol = Literal['ADAPTIVE_TUNING_P1', 'AUDIT_P2', 'POLICY_FETCH', 'EMERGENCY_OVERRIDE']
ProposalDirection = Literal['INCREASE', 'DECREASE', 'SET', 'FLIP']
SourceDaemon = Literal['OLD', 'PCS', 'MHVA', 'SYSTEM_CORE']

class STRResult(BaseModel):
    transition_id: UUID4 = Field(..., description="Unique ID linking to the original State Transition.")
    success: bool
    adaptive_threshold_management_failed: bool = Field(False, description="True if the ADTM check failed.")
    error_message: Optional[str] = None
    processed_at: NonNegativeFloat

class GovernanceProposal(BaseModel):
    proposal_id: UUID4 = Field(..., description="Unique identifier for the proposal lifecycle.")
    governance_protocol: ProposalProtocol
    version_epoch: str
    timestamp: NonNegativeFloat
    source_daemon: SourceDaemon
    
    target_policy_metric: str = Field(..., description="The specific metric targeted (e.g., 'CORE_LATENCY_THRESHOLD').")
    direction: ProposalDirection
    
    change_value: Optional[float] = None
    current_monitor_rate: NonNegativeFloat
    current_target_value: Optional[float] = None
    
    rationale: str = Field(..., min_length=20)
    justification_vector: Optional[conlist(str, min_items=1)] = None

    class Config:
        # Ensures compatibility with dictionary unpacking
        extra = "forbid"