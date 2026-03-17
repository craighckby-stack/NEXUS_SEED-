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
        if not hashlib.algorithms_available or default_algorithm not in hashlib.algorithms_available:
             raise HashingInitializationError(f"Default algorithm '{default_algorithm}' is unavailable.")
        self._default_algorithm = default_algorithm
        self._standard_exclusions = HashingConfiguration.STANDARD_EXCLUSIONS

    @staticmethod
    def _filter_artifact_data(
        artifact_data: Dict[str, Any], 
        exclusion_keys: Optional[Iterable[str]] = None
    ) -> Dict[str, Any]:
        """Creates a filtered copy of the artifact data, excluding specified keys.

        Note: This is an efficient, non-recursive, shallow key exclusion function.
        """
        if not exclusion_keys:
            return artifact_data.copy()

        exclusions = set(exclusion_keys)
        
        filtered_data = {}
        for key, value in artifact_data.items():
            if key not in exclusions:
                filtered_data[key] = value
        return filtered_data

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
            raise RuntimeError(f"Unexpected serialization error during hashing: {e}")


    def get_canonical_hash(
        self,
        artifact_data: Dict[str, Any], 
        algorithm: Optional[str] = None,
        exclusion_keys: Optional[Iterable[str]] = None
    ) -> str:
        """
        Generates a deterministic hash for a given artifact dictionary, optionally 
        excluding transient keys to maintain environment independence.

        Args:
            artifact_data: The dictionary representation of the artifact state.
            algorithm: The hashing algorithm (defaults to configured instance algorithm).
            exclusion_keys: Keys in the dictionary to ignore before hashing (transient data).

        Returns:
            The hexadecimal hash digest string.
        """
        hash_algo = algorithm if algorithm else self._default_algorithm
        
        try:
            # 1. Pre-process/Filter data
            processed_data = self._filter_artifact_data(artifact_data, exclusion_keys)
            
            # 2. Serialize filtered data
            serialized_data = self._serialize_artifact(processed_data)
            
            # 3. Hash
            h = hashlib.new(hash_algo)
            h.update(serialized_data)
            return h.hexdigest()
        except ValueError:
            raise HashingInitializationError(f"Unsupported or invalid hashing algorithm specified: {hash_algo}")
        except (HashingInitializationError, ArtifactSerializationError, RuntimeError):
            raise
        except Exception as e:
            raise RuntimeError(f"Failed to generate canonical hash using {hash_algo}: {e}")

    def verify_artifact_integrity(
        self,
        expected_hash: str, 
        artifact_data: Dict[str, Any], 
        algorithm: Optional[str] = None,
        exclusion_keys: Optional[Iterable[str]] = None
    ) -> bool:
        """
        Verifies if the calculated hash of the artifact (with optional key exclusions) 
        matches the provided expected_hash.

        Args:
            expected_hash: The known hash value the artifact should possess.
            artifact_data: The artifact dictionary to verify.
            algorithm: The hashing algorithm used.
            exclusion_keys: Keys to ignore during hash calculation.

        Returns:
            True if the hashes match, False otherwise.
        """
        try:
            calculated_hash = self.get_canonical_hash(artifact_data, algorithm, exclusion_keys)
            
            # Use constant time comparison for security
            return hashlib.compare_digest(calculated_hash, expected_hash)
        except Exception:
            # If hashing fails during verification, return False as integrity cannot be confirmed.
            return False

