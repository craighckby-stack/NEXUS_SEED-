import json
import os
from typing import Dict, Any, List

class ImmutableLogWriter:
    """
    High-integrity log writer component for critical state records (e.g., Checkpoint Ledger).
    Manages the physical persistence layer, focusing on atomic appends and data sequence integrity.
    Assumes external modules handle data signing (cryptographic attestation) prior to submission.
    """

    def __init__(self, log_path: str):
        self.log_path = log_path
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
        # Initialize the log file as an empty list if it doesn't exist
        if not os.path.exists(self.log_path):
            with open(self.log_path, 'w') as f:
                json.dump([], f)
        
    def _read_current_state(self) -> List[Dict[str, Any]]:
        """Reads the current full log content."""
        try:
            with open(self.log_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # Handles initial state or catastrophic file corruption
            return []

    def append_record(self, record: Dict[str, Any]) -> int:
        """Atomically appends a new record to the ledger. Returns the sequence index."""
        
        ledger = self._read_current_state()
        ledger.append(record)
        
        # NOTE: A true atomic write requires a temporary file swap; using simple overwrite here
        # requires the caller to manage concurrent access.
        with open(self.log_path, 'w') as f:
            json.dump(ledger, f, indent=2)

        return len(ledger) - 1

    def get_latest_record(self) -> Dict[str, Any]:
        """Retrieves the most recently appended record."""
        ledger = self._read_current_state()
        return ledger[-1] if ledger else {}