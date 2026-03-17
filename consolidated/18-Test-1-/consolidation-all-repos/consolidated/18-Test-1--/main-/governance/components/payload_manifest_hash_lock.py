import hashlib
import json
from typing import Dict, Any, Optional

# NOTE: Dependency requires governance/config/hash_exclusion_config.py to exist.
from governance.config.hash_exclusion_config import HashExclusionUtility

class IntegrityError(Exception):
    """Custom error raised upon cryptographic integrity breach (hash mismatch)."""
    pass

class LockNotEstablishedError(RuntimeError):
    """Custom error raised if verification is attempted before lock creation."""
    pass


class PayloadManifestHashLock:
    """PMH: Manages cryptographic integrity lock across GSEP Stages 3 and 4.
    Ensures that the structured decision payload (e.g., M-02) reviewed post-simulation 
    is cryptographically identical to the payload executed in the subsequent phase.
    
    Relies on canonical JSON serialization and configured exclusion lists to 
    maintain stable integrity checks despite transient runtime metadata.
    """

    # Standard Python hashlib uses lowercase names for initialization
    DEFAULT_ALGORITHM = 'sha256'
    
    def __init__(self, hash_algorithm: str = DEFAULT_ALGORITHM, payload_type: str = 'M-02'):
        # Standardize algorithm name to ensure compatibility with hashlib.new()
        self.algorithm: str = hash_algorithm.lower()
        self.payload_type: str = payload_type
        self._manifest_hash: Optional[str] = None
        
        if self.algorithm not in hashlib.algorithms_available:
            raise ValueError(f"Unsupported hash algorithm: {self.algorithm}")

    @property
    def lock_value(self) -> Optional[str]:
        """Provides read access to the stored hash lock."""
        return self._manifest_hash

    def _canonicalize_and_encode(self, payload_data: Dict[str, Any]) -> bytes:
        """
        1. Applies exclusion rules using HashExclusionUtility.
        2. Serializes data into canonical JSON (sorted keys, compact format).
        3. Encodes the resulting string to bytes using UTF-8.
        Returns: Encoded byte string ready for hashing.
        """
        
        # 1. Clean data: Respect configured exclusion list for the specific payload type.
        cleaned_data = HashExclusionUtility.apply_exclusions(payload_data, self.payload_type)

        # 2. Serialize and Encode: Ensure reproducibility and consistent encoding.
        canonical_string = json.dumps(cleaned_data, sort_keys=True, separators=(',', ':'))
        return canonical_string.encode('utf-8')

    def _calculate_hash(self, encoded_data: bytes) -> str:
        """Calculates the hex digest of the encoded byte string."""
        h = hashlib.new(self.algorithm)
        h.update(encoded_data)
        return h.hexdigest()

    def create_lock(self, payload: Dict[str, Any]) -> str:
        """
        Establishes an immutable hash lock for the provided payload (Stage 3 -> 4 transition).
        Returns the calculated hex digest (the lock value).
        """
        encoded_data = self._canonicalize_and_encode(payload)
        self._manifest_hash = self._calculate_hash(encoded_data)
        return self._manifest_hash

    def verify_lock(self, payload: Dict[str, Any]) -> bool:
        """
        Verifies the current payload against the stored hash lock (Stage 4 verification).
        Raises IntegrityError if the hashes mismatch.
        """
        if self._manifest_hash is None:
            raise LockNotEstablishedError(
                f"PMH lock not yet established for {self.payload_type}. Cannot verify integrity."
            )

        encoded_data = self._canonicalize_and_encode(payload)
        current_hash = self._calculate_hash(encoded_data)

        if current_hash != self._manifest_hash:
            raise IntegrityError(
                f"Payload Integrity Breach Detected for {self.payload_type}. "
                f"Expected: {self._manifest_hash[:16]}..., Got: {current_hash[:16]}..."
            )

        return True
