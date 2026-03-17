from typing import Dict, Any
import json
import os

class ConfigLoadError(Exception):
    """Custom exception for configuration loading failure."""
    pass

class ConfigArtifactLoader:
    """
    Utility responsible for safely locating, loading, and parsing critical
    configuration artifacts (like schemas or default templates) from designated
    artifact repositories (e.g., local FS, S3, specialized artifact registry).
    """
    
    ARTIFACT_MAP = {
        'PCTM_V1_SCHEMA': os.environ.get('AGI_PCTM_SCHEMA_PATH', 'schemas/agca_pctm_v1.json')
    }

    @staticmethod
    def load_schema(artifact_key: str = 'PCTM_V1_SCHEMA') -> Dict[str, Any]:
        """Loads a schema dictionary based on the artifact key."""
        path = ConfigArtifactLoader.ARTIFACT_MAP.get(artifact_key)
        if not path:
            raise ConfigLoadError(f"Unknown configuration artifact key: {artifact_key}")
            
        if not os.path.exists(path):
            # In a distributed system, this would attempt retrieval from network/S3 first
            raise ConfigLoadError(f"Schema file not found at path: {path}")

        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (IOError, json.JSONDecodeError) as e:
            raise ConfigLoadError(f"Failed to load or parse schema {artifact_key} at {path}: {e}")