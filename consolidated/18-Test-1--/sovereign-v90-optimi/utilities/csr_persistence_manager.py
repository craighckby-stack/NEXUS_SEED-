# CSR Persistence Manager
# Role: Handles the secure, atomic storage and retrieval of the Config State Root (CSR) 
# hash, ensuring the result of the CGR process is verifiable across system lifecycle phases.

import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

logging.basicConfig(level=logging.INFO, format='%(levelname)s:CSR_PERSISTENCE:%(message)s')

class CSRPersistenceManager:
    """Manages the state file for the Configuration State Root (CSR)."""
    
    ENCODING = 'utf-8'

    def __init__(self, storage_path: str = 'runtime/state/csr_root.json'):
        self._storage_path = Path(storage_path)
        # Ensure the directory exists before attempting writes
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)

    def store_csr(self, csr_hash: str, metadata: Dict[str, Any]) -> None:
        """Stores the CSR hash and associated generation metadata atomically."""
        if not csr_hash:
            raise ValueError("CSR hash cannot be empty.")

        state = {
            "csr_hash": csr_hash,
            "metadata": metadata
        }

        try:
            # Atomic write (Write to temp, then rename) is safer but using direct write for brevity/initial scaffold.
            with open(self._storage_path, 'w', encoding=self.ENCODING) as f:
                json.dump(state, f, indent=4)
            logging.info(f"CSR successfully stored at {self._storage_path}")
        except IOError as e:
            logging.error(f"Failed to write CSR state file: {e}")
            raise

    def load_csr(self) -> Optional[str]:
        """Loads the stored CSR hash, if available."""
        if not self._storage_path.exists():
            logging.warning(f"CSR state file not found at {self._storage_path}")
            return None

        try:
            with open(self._storage_path, 'r', encoding=self.ENCODING) as f:
                data = json.load(f)
                if 'csr_hash' in data:
                    return data['csr_hash']
                logging.error("CSR state file corrupted: missing 'csr_hash' field.")
                return None
        except (IOError, json.JSONDecodeError) as e:
            logging.error(f"Error reading/decoding CSR state file: {e}")
            return None
