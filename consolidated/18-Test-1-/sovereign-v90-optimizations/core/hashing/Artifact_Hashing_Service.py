# core/hashing/Artifact_Hashing_Service.py
# Purpose: Provides deterministic hashing utilities for complex state artifacts (e.g., ASM, TEDS) 
# ensuring consistency and verifiability required by the XEL schema, supporting metadata exclusion.

import json
import hashlib
from typing import Dict, Any, Optional, Iterable, Set
from .HashingErrors import HashingInitializationError, ArtifactSerializationError

# NOTE: STANDARD_EXCLUSIONS and DEFAULT_ALGORITHM are now sourced from centralized configuration.
from core.config.HashingConfiguration import HashingConfiguration

class ArtifactHashingService:
    """
    Service responsible for generating canonical and deterministic hashes for
    artifact dictionaries required for XEL integrity checks.
    
    This service supports exclusion of transient keys (like timestamps or IDs)
    to maintain determinism.
    """

    def __init__(self, default_algorithm: str = HashingConfiguration.DEFAULT_ALGORITHM):
        """Initializes the service with a specified default hashing algorithm.

        Args:
            default_algorithm: Overrides the system-wide default hash algorithm.
        """
        # Ensure algorithm availability early
        if not hashlib.algorithms_available or default_algorithm not in hashlib.algorithms_available:
             raise HashingInitializationError(f"Default algorithm '{default_algorithm}' is unavailable.")
             
        self._default_algorithm = default_algorithm
        # Store standard exclusions as a frozen set for immutability and efficient lookups
        self._standard_exclusions: Set[str] = frozenset(HashingConfiguration.STANDARD_EXCLUSIONS)

    @staticmethod
    def _shallow_filter_artifact_data(
        artifact_data: Dict[str, Any], 
        exclusion_keys: Set[str]
    ) -> Dict[str, Any]:
        """Creates a filtered copy of the artifact data, excluding specified root keys.

        NOTE: This is a shallow filter, only supporting root-level key exclusions.
        Future cycles must integrate the /emergent/hashing/DeepExclusionFilter.py 
        for path-aware exclusion necessary for full AGI state management.
        """
        # The dictionary comprehension handles the case where exclusion_keys is empty,
        # providing a clear, concise way to filter or copy the dictionary.
        return {
            key: value 
            for key, value in artifact_data.items() 
            if key not in exclusion_keys
        }

    @staticmethod
    def _serialize_artifact(artifact_data: Dict[str, Any]) -> bytes:
        """Helper to perform canonical JSON serialization.
        Ensures bit-for-bit identical representation regardless of system.
        """
        try:
            # Canonical serialization: sorted keys, minimal separators, utf-8 encoding.
            return json.dumps(
                artifact_data,
                sort_keys=True,
                separators=(',', ':')
            ).encode('utf-8')
        except TypeError as e:
            raise ArtifactSerializationError(f"Artifact data contains unserializable types: {e}")
        except Exception as e:
            # Catch general errors and wrap them to maintain consistent serialization error type
            raise ArtifactSerializationError(f"Unexpected serialization error during hashing: {e}")

    def _calculate_digest(self, data: bytes, algorithm: str) -> str:
        """Internal helper to safely calculate the hash digest.
        Handles algorithm validation and mapping native errors to kernel-defined errors.
        """
        try:
            h = hashlib.new(algorithm)
            h.update(data)
            return h.hexdigest()
        except ValueError:
            # Occurs if hashlib.new(hash_algo) fails, indicating an invalid algorithm
            raise HashingInitializationError(f"Unsupported or invalid hashing algorithm specified: {algorithm}")

    def get_canonical_hash(
        self,
        artifact_data: Dict[str, Any], 
        algorithm: Optional[str] = None,
        exclusion_keys: Optional[Iterable[str]] = None,
        use_standard_exclusions: bool = True
    ) -> str:
        """
        Generates a deterministic hash for a given artifact dictionary, optionally 
        excluding transient keys to maintain environment independence.

        Args:
            artifact_data: The dictionary representation of the artifact state.
            algorithm: The hashing algorithm (defaults to configured instance algorithm).
            exclusion_keys: Additional keys in the dictionary to ignore before hashing.
            use_standard_exclusions: If True, automatically merges system-wide standard exclusions.

        Returns:
            The hexadecimal hash digest string.
        """
        hash_algo = algorithm if algorithm else self._default_algorithm
        
        try:
            # 1. Determine final exclusion set using update() for efficiency and clarity
            exclusions: Set[str] = set()
            
            if use_standard_exclusions:
                # Start with the efficient frozen set of standard exclusions
                exclusions.update(self._standard_exclusions)
                
            if exclusion_keys:
                # Safely incorporate runtime exclusions (handles lists, tuples, sets, etc.)
                exclusions.update(exclusion_keys)

            # 2. Filter data
            # Using the optimized shallow filter for root-level exclusions.
            processed_data = self._shallow_filter_artifact_data(artifact_data, exclusions)
            
            # 3. Serialize filtered data
            serialized_data = self._serialize_artifact(processed_data)
            
            # 4. Hash using internal helper
            return self._calculate_digest(serialized_data, hash_algo)
            
        except (HashingInitializationError, ArtifactSerializationError):
            # Allow internal custom errors to propagate (raised in helpers)
            raise
        except Exception as e:
            # Catch remaining general operational errors (e.g., input iterable issues)
            raise RuntimeError(f"Critical operational error generating canonical hash using {hash_algo}: {e}")

    def verify_artifact_integrity(
        self,
        expected_hash: str, 
        artifact_data: Dict[str, Any], 
        algorithm: Optional[str] = None,
        exclusion_keys: Optional[Iterable[str]] = None,
        use_standard_exclusions: bool = True
    ) -> bool:
        """
        Verifies if the calculated hash of the artifact (with optional key exclusions) 
        matches the provided expected_hash.

        Args:
            expected_hash: The known hash value the artifact should possess.
            artifact_data: The artifact dictionary to verify.
            algorithm: The hashing algorithm used.
            exclusion_keys: Keys to ignore during hash calculation.
            use_standard_exclusions: If True, automatically merges system-wide standard exclusions.

        Returns:
            True if the hashes match, False otherwise.
        """
        try:
            calculated_hash = self.get_canonical_hash(
                artifact_data, 
                algorithm, 
                exclusion_keys,
                use_standard_exclusions
            )
            
            # Use constant time comparison for security
            return hashlib.compare_digest(calculated_hash, expected_hash)
        except ArtifactSerializationError:
            # Data processing failure (unserializable data) means integrity cannot be confirmed.
            return False
        except HashingInitializationError:
            # Critical configuration errors (like unsupported algorithms) must propagate to callers.
            raise
        except Exception:
            # Catch all other unexpected operational errors during verification
            return False