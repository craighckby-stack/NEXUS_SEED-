from typing import TypedDict, Optional, List

# --- Artifact Structure Definition Model (ASDM) ---
# Purpose: Enforce structural integrity of input artifacts before cryptographic hashing
# within GSCM. All governance state transitions must adhere to this structure.

class TransitionMetadata(TypedDict):
    version: str
    actor_id: str
    parent_stage_id: str

class GSEPTransitionArtifact(TypedDict):
    metadata: TransitionMetadata
    configuration_diff: Dict[str, Any]  # Delta of configuration changes
    audit_trail_hashes: List[str]      # Hashes of external audit logs/reports
    evolution_directives: Dict[str, Any] # Specific governance commands enacted
    
# Utility to map stage_id to specific required schema if protocol branches exist
SCHEMA_MAP = {
    'L0': GSEPTransitionArtifact, 
    'L1': GSEPTransitionArtifact,
    # ... (L2, L3, etc.)
}