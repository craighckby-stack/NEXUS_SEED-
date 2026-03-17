import hashlib
import os
from typing import Dict, List, Optional

# NOTE: This exception definition should ultimately be sourced from governance.exceptions
class IntegrityHalt(Exception):
    """Raised when a P-M02 violation (Integrity Exhaustion) is detected."""
    pass

class ConfigurationDeltaAuditor:
    """
    CDA enforces GAX III (Policy Immutability) post-G0 Seal by continuously 
    auditing the runtime hashes of critical configuration files against the 
    initial EMSU-provided manifest. 

    If a delta is detected, it reports a P-M02 violation (Integrity Exhaustion) 
    and raises an IntegrityHalt, signaling immediate system shutdown or lockdown 
    to the FSMU/PIM.
    """

    HASH_ALGORITHM = 'sha256'
    READ_CHUNK_SIZE = 65536  # 64 KB for efficient I/O

    def __init__(self, sealed_manifest: Dict[str, str]):
        """
        Initializes the auditor with the G0 sealed state manifest.

        Args:
            sealed_manifest: A dictionary mapping file paths (str) to 
                             their expected baseline hashes (str).
        """
        if not isinstance(sealed_manifest, dict) or not sealed_manifest:
            raise ValueError("Sealed manifest must be a non-empty dictionary.")
            
        # The manifest is the source of truth for paths and expected hashes.
        self.manifest: Dict[str, str] = sealed_manifest

    def _calculate_hash(self, file_path: str) -> Optional[str]: 
        """
        Calculates the cryptographic hash (SHA256) of a given file path.
        Returns None if the file is not found. Raises IntegrityHalt on I/O errors.
        """
        if not os.path.exists(file_path):
            return None

        hasher = hashlib.new(self.HASH_ALGORITHM)
        try:
            with open(file_path, 'rb') as f:
                while chunk := f.read(self.READ_CHUNK_SIZE):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except IOError as e:
            # Inability to read a critical file (permissions, hardware fail) constitutes a violation.
            raise IntegrityHalt(
                f"P-M02 IO Error calculating hash for critical path: {file_path}. Details: {e}"
            )

    def execute_audit_cycle(self) -> bool:
        """
        Executes a single audit cycle. Compares current runtime hashes against 
        the G0 sealed manifest.
        
        Raises:
            IntegrityHalt: If any P-M02 configuration delta or corruption is detected.
        
        Returns:
            True if all configuration files match their baseline hashes.
        """
        for path, baseline_hash in self.manifest.items():
            current_hash = self._calculate_hash(path)
            
            if current_hash is None:
                # File disappearance is a critical failure state
                raise IntegrityHalt(f"P-M02 Critical Configuration Missing: {path}")

            if current_hash != baseline_hash:
                violation_msg = (
                    f"P-M02 Configuration Delta detected on: {path}. "
                    f"Baseline Hash: {baseline_hash[:8]}..., Current Hash: {current_hash[:8]}..."
                )
                raise IntegrityHalt(violation_msg)
                
        return True

    def get_audit_targets(self) -> List[str]: 
        """Returns the list of critical file paths being monitored from the manifest."""
        return list(self.manifest.keys())