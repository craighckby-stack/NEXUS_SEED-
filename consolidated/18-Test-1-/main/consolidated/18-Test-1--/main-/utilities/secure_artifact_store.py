import json
import logging
import hashlib
from typing import Dict, Any, Optional, Set

# --- Custom Exceptions ---

class ArtifactStoreError(Exception):
    """Base exception for all artifact store operations."""
    pass

class ArtifactLoadError(ArtifactStoreError):
    """Raised when the artifact file cannot be loaded (not found, permission error)."""
    pass

class ArtifactValidationError(ArtifactStoreError):
    """Raised when the artifact content fails structural or key validation (e.g., missing required keys)."""
    pass

class ArtifactIntegrityError(ArtifactStoreError):
    """Raised when the artifact's computed hash does not match the expected hash/signature."""
    pass

# --- Setup ---

logger = logging.getLogger(__name__)

class SecureArtifactStore:
    """ 
    Handles secure loading, validation, hashing, and caching of critical governance artifacts.
    Ensures data integrity via optional SHA256 checking and reduces disk I/O.
    """

    def __init__(self, encoding: str = 'utf-8'):
        self.encoding = encoding
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _calculate_sha256(self, path: str) -> str:
        """Calculates the SHA256 hash of the file content (binary read)."""
        hasher = hashlib.sha256()
        try:
            with open(path, 'rb') as f:
                while chunk := f.read(4096):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            raise ArtifactLoadError(f"Failed to calculate hash for {path}: {e}")

    def load_artifact(self, 
                       path: str, 
                       required_keys: Optional[Set[str]] = None, 
                       expected_sha256: Optional[str] = None,
                       force_reload: bool = False) -> Dict[str, Any]:
        """
        Loads a JSON artifact, optionally verifies its hash, and caches the result.
        
        Args:
            path: File system path to the artifact.
            required_keys: A set of keys that must exist in the top-level dictionary.
            expected_sha256: The hash expected for integrity verification.
            force_reload: If True, bypass the cache and reload from disk.
        """
        
        if path in self._cache and not force_reload:
            logger.debug(f"Cache hit for artifact: {path}")
            return self._cache[path]

        logger.info(f"Attempting to load artifact: {path}")
        
        # 1. Integrity Verification (before reading content, as a load prerequisite)
        if expected_sha256:
            computed_hash = self._calculate_sha256(path)
            
            if computed_hash.lower() != expected_sha256.lower():
                logger.critical(f"Integrity check failed for {path}. Expected: {expected_sha256[:8]}..., Got: {computed_hash[:8]}...")
                raise ArtifactIntegrityError(f"Integrity check failed for {path}. Hash mismatch.")

        # 2. File I/O and JSON Decoding
        try:
            with open(path, 'r', encoding=self.encoding) as f:
                data = json.load(f)
        
        except FileNotFoundError as e:
            logger.error(f"Artifact Not Found: {path}")
            raise ArtifactLoadError(f"Missing critical file: {path}") from e
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in artifact: {path}")
            raise ArtifactValidationError(f"Corrupt artifact data in {path}: {e}") from e
        except IOError as e:
             logger.error(f"IO Error reading artifact: {path}")
             raise ArtifactLoadError(f"Permission or Read Error on {path}: {e}") from e

        # 3. Structural Validation (Required Keys)
        if required_keys:
            missing_keys = required_keys - set(data.keys())
            if missing_keys:
                logger.error(f"Artifact {path} failed key validation.")
                raise ArtifactValidationError(f"Artifact {path} missing required keys: {missing_keys}")

        # 4. Caching and Return
        self._cache[path] = data
        logger.debug(f"Artifact loaded and cached: {path}")
        return data
