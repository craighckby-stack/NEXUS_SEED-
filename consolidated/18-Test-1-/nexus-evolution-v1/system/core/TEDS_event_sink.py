import json
import time
import hashlib
from typing import Dict, Any, List, Optional

# NOTE: Architectural imports restored based on system requirements
# It is highly recommended that TEC_CONTRACT loading is externalized via a Contract Manager utility.
from config.TEDS_event_contract import TEC_CONTRACT
from system.monitoring.IH_Sentinel import IntegritySentinel

# --- Custom Exceptions for Auditability ---
class TEDSContractViolation(Exception):
    """Base exception for TEDS compliance failures."""
    pass

class TEDSSequenceBreach(TEDSContractViolation):
    """Raised when the event stage sequence is violated."""
    pass

class TEDSDataIntegrityBreach(TEDSContractViolation):
    """Raised when the event payload lacks required keys or schema compliance."""
    pass

class TEDSEventSink:
    """
    Manages the sequential, immutable writing of events to the Trusted Event Data Stream (TEDS).
    Enforces compliance with the TEC (TEDS Event Contract), including stage-specific requirements,
    and signals the IntegritySentinel upon detected violation.
    """
    
    # Explicitly define the dependency on the Integrity Halt system
    INTEGRITY_HALT_SIGNAL = IntegritySentinel.raise_integrity_halt
    
    def __init__(self, persistence_handler: Optional[List[Dict[str, Any]]] = None):
        """
        Initializes the sink. Persistence can be injected (e.g., file writer, DB connector).
        """
        self.log_stream: List[Dict[str, Any]] = persistence_handler if persistence_handler is not None else []
        # Resumes logging sequence if existing persistence handler is provided
        self.expected_sequence_id: int = len(self.log_stream)

    def _calculate_contract_hash(self, contract_entry: Dict[str, Any]) -> str:
        """Calculates a consistent SHA256 hash of the contract definition for immutable logging."""
        # Must ensure consistent serialization (sorted keys) before hashing
        serialized = json.dumps(contract_entry, sort_keys=True).encode('utf-8')
        return hashlib.sha256(serialized).hexdigest()

    def _get_expected_contract_entry(self, stage: str) -> Dict[str, Any]:
        """Internal check for strict sequential stage adherence and returns the contract definition."""
        try:
            contract_entry = TEC_CONTRACT["sequence"][self.expected_sequence_id]
            expected_stage = contract_entry["stage"]
            
            if stage != expected_stage:
                raise TEDSSequenceBreach(
                    f"Expected stage '{expected_stage}' (Seq ID: {self.expected_sequence_id}), received '{stage}'."
                )
            return contract_entry
        except IndexError:
            raise TEDSSequenceBreach(
                f"TEDS sequence overflow. Attempted ID {self.expected_sequence_id}, contract length {len(TEC_CONTRACT['sequence'])}$."
            )

    def _check_payload(self, event: Dict[str, Any], contract_entry: Dict[str, Any]) -> None:
        """
        Internal check for required key presence, combining global and stage-specific requirements.
        """
        
        global_keys = TEC_CONTRACT.get("required_keys", [])
        stage_keys = contract_entry.get("stage_specific_keys", [])
        
        required_keys = set(global_keys) | set(stage_keys)
        
        missing_keys = [key for key in required_keys if key not in event]
        
        if missing_keys:
            raise TEDSDataIntegrityBreach(
                f"Event for stage '{contract_entry['stage']}' (Seq ID: {self.expected_sequence_id}) missing required keys: {', '.join(missing_keys)}."
            )

    def validate_event(self, event_data: Dict[str, Any], stage_id: str) -> Dict[str, Any]:
        """
        Runs comprehensive validation checks (sequence and payload schema).
        Returns the confirmed contract entry for the stage.
        """
        contract_entry = self._get_expected_contract_entry(stage_id)
        self._check_payload(event_data, contract_entry)
        return contract_entry
        
    def commit_event(self, event_data: Dict[str, Any], stage_id: str) -> bool:
        """Attempts to append a validated event to the immutable TEDS."""
        try:
            # Step 1: Validation
            contract_entry = self.validate_event(event_data, stage_id)
            
            # Step 2: Successful Commitment Preparation
            contract_hash = self._calculate_contract_hash(contract_entry)

            event_record = {
                "sequence_id": self.expected_sequence_id,
                "stage": stage_id,
                "contract_hash": contract_hash, # Now using cryptographic hashing (SHA256)
                "commit_timestamp": time.time(), 
                "data": event_data
            }
            
            # Step 3: Write to Stream and Increment Sequence
            self.log_stream.append(event_record)
            self.expected_sequence_id += 1
            return True

        except TEDSContractViolation as e:
            # CRITICAL: Signal the halt system immediately upon contract violation
            details = {
                "violation_type": type(e).__name__,
                "error_message": e.args[0], 
                "sequence_id_attempted": self.expected_sequence_id,
                "stage_attempted": stage_id,
                "event_data_attempted": event_data, 
                "contract_definition_length": len(TEC_CONTRACT['sequence'])
            }
            
            self.INTEGRITY_HALT_SIGNAL(
                reason=f"TEDS_CONTRACT_BREACH: {type(e).__name__}",
                details=e.args[0], 
                context=details
            )
            return False

    def get_audit_trail(self) -> List[Dict[str, Any]]:
        """Returns the current state of the log stream (for inspection only)."""
        return self.log_stream
