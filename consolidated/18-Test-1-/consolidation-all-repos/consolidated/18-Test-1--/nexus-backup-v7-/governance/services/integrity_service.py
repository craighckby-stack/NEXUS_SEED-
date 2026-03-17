import hashlib
from typing import Any, Dict

# Assuming canonicalizer.py is imported correctly based on file path:
from governance.utils.canonicalizer import canonicalize_json

class IntegrityService:
    """
    Provides cryptographic integrity checks for governance payloads.

    Utilizes canonical JSON serialization to ensure deterministic input
    for hashing and subsequent signature generation.
    """

    @staticmethod
    def get_canonical_hash(payload: Dict[str, Any], algorithm: str = 'sha256') -> str:
        """
        Generates the cryptographic hash of the canonicalized payload.

        Args:
            payload: The data dict to be processed.
            algorithm: Hashing algorithm (e.g., 'sha256', 'sha3_256').

        Returns:
            The hexadecimal hash digest string.
        
        Raises:
            NotImplementedError: If the specified hashing algorithm is unsupported.
        """
        try:
            canonical_bytes = canonicalize_json(payload)
        except ValueError as e:
            # Re-raise conversion errors clearly
            raise ValueError(f"Failed to canonicalize payload: {e}")

        try:
            hasher = hashlib.new(algorithm)
        except ValueError:
            raise NotImplementedError(f"Hashing algorithm '{algorithm}' not supported.")

        hasher.update(canonical_bytes)
        return hasher.hexdigest()
