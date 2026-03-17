import hashlib
import json
import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

class CheckpointValidationAttestationModule:
    """
    Manages the creation, verification, and attestation of definitive state anchors (Psi_N).
    Utilizes canonical JSON serialization to guarantee deterministic hashing of state snapshots.
    """
    
    # Static Configuration for canonical serialization (K:V -> K:V, avoiding whitespace)
    CANONICAL_SEPARATORS = (',', ':')
    ENCODING = 'utf-8'

    def __init__(self, ledger_path: str = './state/checkpoint_ledger.json'):
        self.ledger_path = ledger_path
        self._initialize_ledger()

    def _initialize_ledger(self):
        """Ensures the ledger file and its directory exist, starting with an empty JSON array if new."""
        os.makedirs(os.path.dirname(self.ledger_path), exist_ok=True)
        if not os.path.exists(self.ledger_path):
            try:
                with open(self.ledger_path, 'w') as f:
                    json.dump([], f)
            except IOError as e:
                print(f"[CVAM ERROR] Failed to initialize ledger at {self.ledger_path}: {e}")
                raise

    def _read_ledger(self) -> List[Dict[str, Any]]:
        """Reads the entire checkpoint ledger from disk."""
        try:
            with open(self.ledger_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # Returns empty list if ledger is new or corrupted
            return []

    def _write_ledger(self, ledger_data: List[Dict[str, Any]]):
        """Writes (overwrites) the entire checkpoint ledger, prioritizing consistency."""
        with open(self.ledger_path, 'w') as f:
            # Use indentation for human readability in the state file, even if less efficient
            json.dump(ledger_data, f, indent=2)

    @staticmethod
    def calculate_canonical_hash(state_data: Dict[str, Any]) -> str:
        """Calculates a deterministic SHA256 hash of state data using canonical serialization."""
        canonical_str = json.dumps(
            state_data, 
            sort_keys=True, 
            separators=CheckpointValidationAttestationModule.CANONICAL_SEPARATORS
        )
        return hashlib.sha256(canonical_str.encode(CheckpointValidationAttestationModule.ENCODING)).hexdigest()

    def generate_attestation_hash_from_path(self, state_snapshot_path: str) -> str:
        """Loads state data from path and generates the attestation hash (Psi_N)."""
        try:
            with open(state_snapshot_path, 'r') as f:
                state_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            raise IOError(f"Failed to load state snapshot {state_snapshot_path}: {e}")
            
        return self.calculate_canonical_hash(state_data)

    def commit_checkpoint(self, state_hash: str, system_time: Optional[datetime] = None) -> Dict[str, Any]:
        """Logs the verified hash as the definitive anchor point."""
        
        # Use ISO 8601 UTC timestamp for global consistency
        time_obj = system_time if system_time else datetime.now(timezone.utc)
        time_str = time_obj.isoformat()
        
        ledger = self._read_ledger()
        
        checkpoint = {
            'hash': state_hash,
            'timestamp': time_str,
            'verified': True,
            'version': 'v94.1',
            'seq_id': len(ledger) # Sequential identifier based on current ledger size
        }

        ledger.append(checkpoint)
        self._write_ledger(ledger)

        print(f"[CVAM] Committed Checkpoint #{checkpoint['seq_id']}: {state_hash[:10]}...")
        return checkpoint

    def get_latest_verified_anchor(self) -> Optional[str]:
        """Retrieves the hash of the latest verified state anchor (Psi_N target)."""
        ledger = self._read_ledger()
        if ledger:
            return ledger[-1]['hash']
        return None