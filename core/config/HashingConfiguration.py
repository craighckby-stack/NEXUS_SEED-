# core/config/HashingConfiguration.py
# Centralized configuration for defining hashing policies across the system.

from typing import Set

class HashingConfiguration:
    """
    Defines system-wide constants for hashing behavior.
    These settings ensure consistency for XEL integrity checks by defining defaults 
    and mandatory key exclusions.
    """

    # Default algorithm for all canonical hashing operations.
    DEFAULT_ALGORITHM: str = 'sha256'

    # Standard set of keys that MUST be excluded from artifact dictionaries 
    # when calculating canonical hashes. These typically represent transient, 
    # environment-specific, or timestamp data that would break determinism.
    STANDARD_EXCLUSIONS: Set[str] = {
        '__transient_id',
        '__timestamp_ms',
        '__execution_path',
        '__metadata_version',
        '__source_run_id',
        '_log_entry_time'
    }

    # Optionally, define maximum hash size limits or other constraints here.
    MAX_HASH_LENGTH: int = 64 # Corresponds to SHA-256/512 lengths

