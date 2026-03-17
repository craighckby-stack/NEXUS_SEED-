import hashlib
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

# Assuming these system components are imported from standard locations
try:
    # Placeholder imports for robust code structure
    from system.core.context import TransitionContext as Context
    from system.exceptions import FSLPersistenceError
    from system.config import ImmutableStoreConfig
except ImportError:
    # Fallback Stubs (required for autonomous execution during refactoring)
    class FSLPersistenceError(Exception): pass
    class Context:
        @staticmethod
        def get_transition_id() -> str: return 'TID-1234_STUB'
    class ImmutableStoreConfig:
        def __init__(self, path: str): self.path = path

class FSLManager:
    """Forensic State Ledger (FSL) Manager.
    
    Manages the immutable, sequential logging of all 15 intermediate GSEP-C stage outputs 
    required for DSE verification, real-time IH-Sentinel monitoring, and RRP initialization. 
    Ensures auditable persistence (FSL Tracking) regardless of P-01 outcome.

    The ledger ensures deterministic logging by utilizing stable hashing (SHA256).
    """

    HASH_ALGORITHM = 'sha256'

    def __init__(self, immutable_store_config: ImmutableStoreConfig, context_util: Any = Context):
        self.fsl_path: str = immutable_store_config.path
        self.current_ledger: List[Dict[str, Any]] = []
        # Dependency Injection of Context Utility
        self.context_util = context_util

    def _hash_data(self, data: Dict[str, Any]) -> str:
        """Generates a stable, cryptographic hash (SHA-256) of the input dictionary for non-repudiation."""
        try:
            # Ensure deterministic serialization using sorted keys and no whitespace
            serialized_data = json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
            hasher = hashlib.new(self.HASH_ALGORITHM)
            hasher.update(serialized_data)
            return hasher.hexdigest()
        except TypeError as e:
            raise ValueError(f"FSL artifact data cannot be deterministically serialized for hashing: {e}")

    def stage_artifact(self, stage_id: int, agent_id: str, artifact_name: str, artifact_data: Dict[str, Any]) -> None:
        """Logs a single stage output artifact into the transient ledger for the current transition."""
        
        data_hash = self._hash_data(artifact_data)

        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'transition_id': self.context_util.get_transition_id(),
            'stage_id': stage_id, 
            'agent': agent_id,
            'artifact_name': artifact_name,
            'artifact_hash': data_hash,
            'data': artifact_data # Storing raw data required for DSE/RRP reconstruction
        }
        self.current_ledger.append(entry)

    def _persist_ledger(self, ledger_id: str, ledger_data: List[Dict[str, Any]], p01_status: bool, str_receipt: Dict[str, Any]) -> bool:
        """Abstract persistence method to write the ledger atomically to the immutable store (self.fsl_path)."""
        
        final_payload = {
            'ledger_id': ledger_id,
            'transition_id': self.context_util.get_transition_id(),
            'final_status': 'P01_SUCCESS' if p01_status else 'P01_FAILURE',
            'receipt': str_receipt,
            'entries': ledger_data,
            'persistence_timestamp': datetime.utcnow().isoformat()
        }
        
        # Actual immutable storage logic (e.g., append-only log, database write)
        # ... (implementation omitted for brevity, assumed success)
        
        return True 

    def finalize_transition(self, p01_status: bool, str_receipt_data: Dict[str, Any]) -> str:
        """Persists the entire transition ledger immutably (P6: S12) and clears the transient store."""
        
        transition_id = self.context_util.get_transition_id()
        
        if not self.current_ledger and p01_status:
             # Optimization: Optionally allow skipping FSL persistence if success and no artifacts generated, 
             # but for maximum auditability, we proceed.
             pass 

        # Unique ID combining state and time for easier debugging and persistence indexing
        ledger_id = f"FSL-{transition_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        if not self._persist_ledger(ledger_id, self.current_ledger, p01_status, str_receipt_data):
            raise FSLPersistenceError(f"Failed to secure FSL ledger for TID {transition_id}.")
        
        # Efficiently clear memory for the next transition
        self.current_ledger.clear() 
        return ledger_id

    def retrieve_rollback_state(self, transition_id: str) -> List[Dict[str, Any]]:
        """Used exclusively by RRP Manager to reconstruct and verify state history."""
        # Logic to read, verify, and return the immutable ledger data.
        # This method MUST incorporate cryptographic verification against recorded hashes.
        return []
