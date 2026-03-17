import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class ConfigurationManager:
    """
    Manages system-wide configurations, schema loading, and validation.
    Decouples critical parameters (like TEMM weights) from operational components.
    Utilizes robust defaults and hierarchical key access for improved developer experience.
    """

    DEFAULT_CONFIG = {
        "system": {"version": "v94.1", "environment": "prod", "log_level": "INFO"},
        "metrics": {"temm_schema": {}}, 
        "paths": {"log_path": "logs/"}
    }

    def __init__(self, config_source: str = "config/system.json"):
        self.config_source = config_source
        self._config_cache: Optional[Dict[str, Any]] = None

    @staticmethod
    def _deep_merge(target: Dict, source: Dict):
        """Recursively merges dictionary source into target, prioritizing source keys."""
        for k, v in source.items():
            if k in target and isinstance(target[k], dict) and isinstance(v, dict):
                ConfigurationManager._deep_merge(target[k], v)
            else:
                target[k] = v

    def _load_config(self) -> Dict[str, Any]:
        """
        Loads configuration data, handling I/O errors and decoding issues, 
        then merges loaded data over robust internal defaults.
        """
        config_data = {}
        try:
            with open(self.config_source, 'r') as f:
                config_data = json.load(f)
            # NOTE: Integration Hook for self._validate_config(config_data) 
            
        except FileNotFoundError:
            logger.warning(
                f"Config file not found ({self.config_source}). Falling back to robust defaults."
            )
            return self.DEFAULT_CONFIG
        except json.JSONDecodeError as e:
            logger.error(
                f"Critical Error: JSON parsing failed for {self.config_source}. Details: {e}"
            )
            # If parsing fails, use defaults to ensure operational stability.
            return self.DEFAULT_CONFIG

        # Merge loaded data over defaults, ensuring a consistent baseline.
        merged_config = self.DEFAULT_CONFIG.copy()
        self._deep_merge(merged_config, config_data)
        
        logger.info(f"Configuration loaded successfully from {self.config_source}.")
        return merged_config

    def initialize(self):
        """Ensures the configuration cache is loaded."""
        if self._config_cache is None:
            self._config_cache = self._load_config()

    def get_config(self) -> Dict[str, Any]:
        """Returns the loaded configuration map, initializing if necessary."""
        if self._config_cache is None:
            self.initialize()
        return self._config_cache
        
    def get(self, key_path: str, default: Any = None) -> Any:
        """
        Retrieves a configuration value using a dot-separated key path (e.g., 'system.environment').
        
        :param key_path: The path to the configuration setting.
        :param default: The value to return if the path is not found.
        :return: The configured value or the default.
        """
        config = self.get_config()
        keys = key_path.split('.')
        current_node = config

        for key in keys:
            if isinstance(current_node, dict) and key in current_node:
                current_node = current_node[key]
            else:
                logger.debug(f"Configuration path '{key_path}' not found. Returning default.")
                return default
        
        return current_node

    def get_temm_schema(self) -> Dict[str, Any]:
        """
        Specialized accessor for the TEMM schema, utilizing the hierarchical getter.
        """
        return self.get("metrics.temm_schema", default={})
