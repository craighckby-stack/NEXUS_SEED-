from typing import TypedDict, Literal, Optional

# --- Type Definitions for Policy Enumeration ---

ProposalProtocol = Literal["ADAPTIVE_TUNING_P1", "AUDIT_P2", "POLICY_FETCH", "EMERGENCY_OVERRIDE"]
ProposalDirection = Literal["INCREASE", "DECREASE", "SET", "FLIP"]
SourceDaemon = Literal["OLD", "PCS", "MHVA", "SYSTEM_CORE"]


# NOTE: These schemas enforce the communication contracts across all governing daemons.

class STRResultSchema(TypedDict):
    """
    Schema for processed State Transition Receipt results stored by monitoring daemons.
    Includes enhanced fields for traceability and detailed failure analysis.
    """
    transition_id: str           # Unique ID linking to the original State Transition.
    success: bool 
    # Explicit flag indicating failure specific to Adaptive Threshold Management (formerly adtm_failed).
    adaptive_threshold_management_failed: bool 
    error_message: Optional[str] # Detailed explanation if success is False.
    processed_at: float          # Unix timestamp when the result was recorded.

class GovernanceProposalSchema(TypedDict):
    """
    Standardized schema for adaptive governance tuning proposals.
    Organized for clear identification, targeting, and justification.
    """
    # Identification and Traceability
    proposal_id: str
    governance_protocol: ProposalProtocol
    version_epoch: str
    timestamp: float
    source_daemon: SourceDaemon
    
    # Target Parameters
    target_policy_metric: str                 
    direction: ProposalDirection              
    
    # Value and Context
    change_value: Optional[float]             # The value change requested (Required unless Direction is 'FLIP').
    current_monitor_rate: float               # The operational rate of the proposing daemon.
    current_target_value: Optional[float]     # The metric value at the time of proposal creation.
    
    # Rationale and Justification
    rationale: str                            
    justification_vector: Optional[list[str]] # Evidence codes/metrics supporting the rationale.