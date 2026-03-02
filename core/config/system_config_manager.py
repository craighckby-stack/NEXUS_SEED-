import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SystemConfigManager:
    """
    Centralized utility for managing core system configurations, resource paths,
    and environment-specific settings for Sovereign AGI components.
    This prevents hardcoding paths (like the CHR schema path) across the codebase.
    """
    
    # Default configuration mappings (can be overridden by environment variables or settings file)
    _DEFAULTS = {
        "CHR_SCHEMA_PATH": "protocol/chr_schema.json",
        "LOG_LEVEL": "INFO",
        "DATABASE_URI": "sqlite:///agi_state.db"
    }

    def __init__(self, config_file: str = "config/system_settings.json"):
        self._config = self._DEFAULTS.copy()
        self._load_config_file(config_file)
        
    def _load_config_file(self, file_path: str):
        path = Path(file_path)
        if path.exists():
            try:
                with open(path, 'r') as f:
                    settings = json.load(f)
                    self._config.update(settings)
                logger.info(f"Loaded configuration from {file_path}")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Could not load or parse configuration file {file_path}. Using defaults. Error: {e}")
        else:
            logger.info(f"Configuration file {file_path} not found. Using internal defaults.")

    def get_path(self, key: str) -> str:
        """Retrieves a configured path string."""
        if key not in self._config:
            raise KeyError(f"Configuration key '{key}' not found in system settings.")
        return self._config[key]

    def get(self, key: str):
        """Retrieves any configured value."""
        return self.get_path(key)
