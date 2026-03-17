from typing import Dict, Any, Optional
import json
from pathlib import Path
import logging

logger = logging.getLogger('CONFIG_MGR')

class ConfigError(Exception):
    """Base exception for Configuration Manager failures."""
    pass

class ConfigurationService:
    """
    Centralized service for loading hierarchical configurations and resolving system paths.
    Abstracts configuration sources (files, environment variables, context injection).
    """

    def __init__(self, root_config_path: str = 'config/root_config.json'):
        self.root_config_path = Path(root_config_path)
        self._cache: Dict[str, Any] = {}
        self._load_root()

    def _load_root(self):
        """Loads the foundational configuration mapping."""
        if not self.root_config_path.exists():
            logger.warning(f"Root config not found at {self.root_config_path}. Starting with empty cache.")
            return
        try:
            content = self.root_config_path.read_text(encoding='utf-8')
            self._cache.update(json.loads(content))
            logger.info(f"Root configuration loaded from {self.root_config_path}")
        except Exception as e:
            raise ConfigError(f"Failed to load root configuration: {e}")

    def get_config(self, key: str, default: Optional[Any] = None) -> Any:
        """Retrieves a value from the configuration cache by key (dot-notation supported)."""
        parts = key.split('.')
        current = self._cache
        
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return default
        return current

    def load_component_config(self, component_name: str, config_filename: str = 'config.json') -> Dict[str, Any]:
        """Loads a specific JSON configuration file for a system component, using a defined search path."""
        
        # For simplicity, assume path defined in root config or standard location
        path_key = f'paths.config.{component_name}'
        base_dir = self.get_config(path_key, f'config/{component_name}')
        
        full_path = Path(base_dir) / config_filename
        
        if not full_path.exists():
            # Attempt common AGI config structure search
            alt_path = Path(f'config/{component_name}.json')
            if alt_path.exists():
                full_path = alt_path
            else:
                 raise ConfigError(f"Component config file not found: {full_path} or {alt_path}")

        try:
            return json.loads(full_path.read_text(encoding='utf-8'))
        except Exception as e:
            raise ConfigError(f"Failed to parse component configuration ({full_path}): {e}")


if __name__ == '__main__':
    print("Configuration Manager requires system context to run effectively. It should be imported by main components.")