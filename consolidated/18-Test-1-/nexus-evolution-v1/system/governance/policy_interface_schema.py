from typing import TypedDict, Literal, Optional

# --- Enumerations for Governance Protocol Primitives ---

ProposalProtocol = Literal[
    "ADAPTIVE_TUNING_P1",
    "AUDIT_P2",
    "POLICY_FETCH",
    "EMERGENCY_OVERRIDE"
]
ProposalDirection = Literal[
    "INCREASE", 
    "DECREASE", 
    "SET", 
    "FLIP"
]
SourceDaemon = Literal[
    "OLD", 
    "PCS", 
    "MHVA", 
    "SYSTEM_CORE"
]


# --- Abstract Schema Components (Maximum Recursive Abstraction) ---

class BaseTraceability(TypedDict):
    """Core identifiers for transactional context and source tracking."""
    # Note: Using float for maximum compatibility and precision for timestamps.
    timestamp: float
    source_daemon: SourceDaemon


class TransitionReceiptCore(TypedDict):
    """Base fields required for State Transition Result (STR) reporting."""
    transition_id: str           # Unique ID linking to the original State Transition.
    success: bool 
    error_message: Optional[str] # Detailed explanation if success is False.


# --- Finalized Interface Schemas ---

class STRResultSchema(TransitionReceiptCore, TypedDict):
    """
    Schema for processed State Transition Receipt results.
    Inherits core tracking fields and adds adaptive failure flags.
    """
    # Explicit flag indicating failure specific to Adaptive Threshold Management.
    adaptive_threshold_management_failed: bool 
    processed_at: float                          # Unix timestamp when the result was recorded.

class GovernanceProposalSchema(BaseTraceability, TypedDict):
    """
    Standardized schema for adaptive governance tuning proposals.
    Constructed via abstract composition (BaseTraceability).
    """
    # Identification (Inherited: timestamp, source_daemon)
    proposal_id: str
    governance_protocol: ProposalProtocol
    version_epoch: str
    
    # Target Parameters
    target_policy_metric: str                 
    direction: ProposalDirection              
    
    # Value and Context
    change_value: Optional[float]             
    current_monitor_rate: float               
    current_target_value: Optional[float]     
    
    # Rationale and Justification
    rationale: str                            
    justification_vector: Optional[list[str]] 

# NOTE: These schemas enforce the communication contracts across all governing daemons.