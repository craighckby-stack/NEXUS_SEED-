from typing import Dict, Any, Optional

ALGORITHM_CONFIGS: Dict[str, Dict[str, Any]] = {
    # Common hashlib algorithms
    "sha256": {"secure_level": 1, "dependencies": ["hashlib"]},
    "sha512": {"secure_level": 2, "dependencies": ["hashlib"]},
    
    # Example of a key derivation function needing custom params
    "argon2id": {"secure_level": 5, "dependencies": ["argon2-cffi"], "params": {"memory_cost": 65536, "time_cost": 4}}
}

DEFAULT_ALGORITHM = "sha256"

def get_algorithm_config(name: str) -> Optional[Dict[str, Any]]:
    """Retrieves the configuration settings for a registered algorithm."""
    return ALGORITHM_CONFIGS.get(name)

def is_algorithm_supported(name: str) -> bool:
    """Checks if the algorithm is registered (availability must be checked dynamically elsewhere)."""
    return name in ALGORITHM_CONFIGS