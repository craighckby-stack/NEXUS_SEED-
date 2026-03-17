import json
from typing import Optional, Dict, Any, List, Tuple
from governance.artifact_locks import ArtifactLocks

# -- Refactored State Configuration (Mimics External Loading) --
# NOTE: In a high-intelligence system, this configuration must be loaded from 
# an immutable external source (e.g., config/governance/gsep_phases.json).
CANONICAL_GSEP_PHASES: Dict[str, str] = {
    'L0': 'INITIATION',
    'L1': 'VET_LOCK_A',
    'L2': 'VET_LOCK_B', 
    'L3': 'PROOF',
    'L4': 'ADJ',
    'L5': 'COMMIT',
    'L6': 'EXECUTION'
}
# -------------------------------------------------------------

class GSEPStageResolver:
    """
    GSR (GSEP Stage Resolver):
    Utility module responsible for idempotently determining the current GSEP state 
    based on verified Artifact Locks (L_N) and reporting the next required stage. 
    Decouples state tracking from the GCO's arbitration function.
    """

    # Static sequence derived from configuration for optimized index lookups.
    _CANONICAL_SEQUENCE: List[str] = list(CANONICAL_GSEP_PHASES.keys())
    
    # State Signals derived from the sequence definition
    INITIAL_STAGE: str = _CANONICAL_SEQUENCE[0] 
    FINAL_STAGE: str = _CANONICAL_SEQUENCE[-1]  
    COMPLETION_SIGNAL: str = "CYCLE_COMPLETE"

    def __init__(self, lock_manager: ArtifactLocks):
        """Initializes the Resolver with the required ArtifactLocks manager.

        Raises:
            TypeError: If lock_manager is not an instance of ArtifactLocks.
        """
        if not isinstance(lock_manager, ArtifactLocks):
             # Ensures high robustness by enforcing dependency type
             raise TypeError("lock_manager must be an instance of ArtifactLocks")
             
        self.locks: ArtifactLocks = lock_manager
        
    def get_stage_sequence(self) -> Tuple[str, ...]:
        """Returns the canonical order of stage lock IDs.
        O(1) complexity as it returns a static tuple."""
        return tuple(self._CANONICAL_SEQUENCE)

    def get_current_stage(self) -> Optional[str]:
        """
        Idempotently determines the highest successfully completed stage lock (L_N).
        Iterates the known canonical sequence backwards.
        """
        for stage_id in reversed(self._CANONICAL_SEQUENCE):
            if self.locks.is_lock_verified(stage_id):
                return stage_id
        
        # If no locks are verified, we are pre-init.
        return None

    def get_next_stage(self) -> str:
        """
        Returns the required subsequent GSEP stage based on current lock status.
        Returns self.COMPLETION_SIGNAL if the L6 cycle is complete.
        
        Raises:
            RuntimeError: If an unknown lock ID is detected in the ArtifactLocks state.
        """
        current_stage = self.get_current_stage()
        
        if current_stage is None:
            return self.INITIAL_STAGE

        if current_stage == self.FINAL_STAGE:
             # L6 is the final execution lock, signal readiness for a new cycle start
             return self.COMPLETION_SIGNAL 

        try:
            current_index = self._CANONICAL_SEQUENCE.index(current_stage)
            # Propose the next sequential stage
            return self._CANONICAL_SEQUENCE[current_index + 1]
            
        except ValueError:
             # Integrity check failed: Lock exists but is not defined in the canonical sequence.
             raise RuntimeError(f"GSEP Integrity Error: Detected unknown lock ID '{current_stage}' in ArtifactLocks state.")

    def check_sequencing_integrity(self, proposed_target_stage: str) -> bool:
        """Validates if transitioning to the proposed_target_stage respects strict sequencing.
        
        This is a critical function for GCO arbitration, ensuring non-skipped transitions.
        It checks if the proposed stage is strictly the next stage required.
        """
        next_expected_stage = self.get_next_stage()
        
        # If the proposed transition is the completion signal itself, it must match expectations.
        if proposed_target_stage == self.COMPLETION_SIGNAL:
             return next_expected_stage == self.COMPLETION_SIGNAL

        if next_expected_stage == self.COMPLETION_SIGNAL:
            # If the cycle is complete, the only valid transition is back to INITIAL_STAGE (L0).
            return proposed_target_stage == self.INITIAL_STAGE

        return proposed_target_stage == next_expected_stage

    def resolve_state_payload(self) -> Dict[str, Any]:
        """Provides a consolidated state report for the GCO and external observers."""
        current_stage_id = self.get_current_stage()
        next_stage_id = self.get_next_stage()
        
        return {
            "current_stage_lock_id": current_stage_id,
            "next_required_stage_id": next_stage_id,
            "gsep_mandate_version": "V94.1", 
            "is_cycle_complete": (next_stage_id == self.COMPLETION_SIGNAL),
            # Reporting the phase description for readability
            "current_phase_description": CANONICAL_GSEP_PHASES.get(current_stage_id, "PRE-INITIATION")
        }