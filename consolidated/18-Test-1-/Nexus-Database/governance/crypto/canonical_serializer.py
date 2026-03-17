from typing import Any, Dict, List, Callable
import json
import hashlib

class CanonicalSerializer:
    """Provides utilities for deterministic serialization (Canonical JSON) and 
    Merkle tree generation required for Artifact Integrity Cryptography (AICV).
    
    Ensures that artifact input is prepared consistently regardless of system state 
    to guarantee identical hashes for identical content.
    
    The hash algorithm is configurable upon instantiation, defaulting to SHA256.
    """

    def __init__(self, hash_algorithm: Callable[..., Any] = hashlib.sha256):
        """Initializes the serializer with a specified hash algorithm constructor.

        Args:
            hash_algorithm: A function (like hashlib.sha256) that returns a new hash object.
        """
        self._hasher_constructor = hash_algorithm

    @staticmethod
    def serialize(data: Dict[str, Any]) -> bytes:
        """Returns deterministically ordered, tightly packed JSON serialization (Canonical JSON)."""
        try:
            # Ensures keys are sorted, separators are minimized, and byte encoding is consistent.
            return json.dumps(
                data,
                sort_keys=True,
                separators=(',', ':')
            ).encode('utf-8')
        except TypeError as e:
            raise ValueError(f"Input data is not JSON serializable: {e}")

    def calculate_digest(self, data: Dict[str, Any]) -> str:
        """Serializes data canonically and returns its hexadecimal digest.

        This combines serialization and hashing into a single convenient step.
        """
        serialized_data = self.serialize(data)
        return self._hasher_constructor(serialized_data).hexdigest()

    def generate_merkle_root(self, chunks: List[bytes]) -> str:
        """Generates the Merkle root hash from a list of serialized data chunks.
        
        The implementation correctly uses iterative pairwise hashing, padding (self-promotion)
        for odd levels, and standard Merkle node construction (Hash(L || R)).
        """
        if not chunks:
            return self._hasher_constructor(b'').hexdigest() 
        
        # 1. Compute leaf hashes (using .digest() for raw bytes)
        leaf_hashes = [self._hasher_constructor(chunk).digest() for chunk in chunks]
        
        # 2. Compute the root iteratively
        return self._compute_merkle_root(leaf_hashes)

    def _compute_merkle_root(self, current_hashes: List[bytes]) -> str:
        """Internal helper to iteratively compute the root hash from a list of hashes."""

        # Iterate until only one hash remains (the root)
        while len(current_hashes) > 1:
            next_level = []
            i = 0
            while i < len(current_hashes):
                left = current_hashes[i]
                
                # If odd number of nodes, the last node is paired with itself (promoted)
                if i + 1 < len(current_hashes):
                    right = current_hashes[i+1]
                else:
                    right = left
                
                # Standard Merkle node construction: H(L || R)
                combined = left + right
                node_hash = self._hasher_constructor(combined).digest()
                next_level.append(node_hash)
                
                i += 2
            
            current_hashes = next_level
        
        # Return the final root hash as hex string
        return current_hashes[0].hex()