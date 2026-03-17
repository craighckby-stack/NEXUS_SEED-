import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Union

# Setup standard logging for the module
logger = logging.getLogger(__name__)

class ConfigurationManager:
    """
    Manages system configuration loading, caching, and persistence.
    Uses JSON format and leverages standard Python logging and pathlib.
    """
    
    def __init__(self, config_path: Union[str, Path]):
        # Ensure config_path is a Path object for standardized operations
        self.config_path = Path(config_path)
        self._config: Optional[Dict[str, Any]] = None

    def _load_file(self) -> Dict[str, Any]:
        """Internal method to handle file reading and decoding."""
        if not self.config_path.exists():
            logger.warning(f"Configuration file not found at {self.config_path}. Returning empty configuration.")
            return {}
        
        try:
            with self.config_path.open('r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON format in {self.config_path}: {e}")
            return {}
        except IOError as e:
            logger.error(f"IO Error reading {self.config_path}: {e}")
            return {}

    def get_config(self, reload: bool = False) -> Dict[str, Any]:
        """Reads, caches, and returns the configuration. Optionally forces a reload."""
        if self._config is None or reload:
            self._config = self._load_file()
        
        # self._config should be a Dict, but check for safety.
        return self._config if self._config is not None else {}

    def save_config(self, new_config: Dict[str, Any]):
        """Writes the updated configuration back to the file path."""
        # Ensure the parent directory exists before writing
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            with self.config_path.open('w', encoding='utf-8') as f:
                json.dump(new_config, f, indent=4)
            self._config = new_config # Update internal cache
            logger.info(f"Configuration successfully saved to {self.config_path}")
        except IOError as e:
            logger.error(f"Could not write configuration to {self.config_path}: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        """Access a configuration value directly from the root."""
        return self.get_config().get(key, default)
        
    def get_stage_config(self, stage_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves configuration specific to a stage."""
        return self.get_config().get('stages', {}).get(stage_id)

    def reload(self):
        """Forces the configuration cache to be refreshed from the file."""
        self.get_config(reload=True)
