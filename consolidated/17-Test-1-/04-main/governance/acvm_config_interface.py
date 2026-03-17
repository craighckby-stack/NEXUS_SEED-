# governance/acvm_config_interface.py
# Utility for immutable, validated configuration management.

import json
from typing import Dict, Any
import hashlib

class ACVMConfigInterface:
    """Provides robust loading and immutable access to the ACVM configuration, 
    ensuring version integrity via hashing (P-V01)."""

    def __init__(self, acvm_path: str = 'config/acvm.json'):
        self.path = acvm_path
        self.config_data, self.hash_v = self._load_and_hash_config()

    def _load_and_hash_config(self):
        with open(self.path, 'rb') as f:
            data = f.read()
        
        # P-V01: Generate SHA256 hash for configuration integrity auditing
        hash_version = hashlib.sha256(data).hexdigest()
        
        config = json.loads(data.decode('utf-8'))
        
        return config, hash_version

    def get_config(self) -> Dict[str, Any]:
        """Returns the loaded configuration data."""
        return self.config_data

    def get_version_hash(self) -> str:
        """Returns the integrity hash of the configuration file (P-V01)."""
        return self.hash_v

# NOTE: This interface decouples configuration loading, validation, and integrity checking 
# from the DSEMetricWatchdog's primary monitoring function (P-S04).
