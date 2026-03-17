import json
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SystemConfigManager:
    """
    Centralized utility for managing core system configurations, resource paths,
    and environment-specific settings for the AGI-KERNEL.
    Implements a Singleton pattern to ensure configuration consistency across the system.
    """
    
    _instance = None
    
    # Default configuration mappings, aligned with Mission requirements
    _DEFAULTS = {
        # Core Memory Systems
        "NEXUS_MEMORY_PATH": "storage/nexus_memory.json", 
        "MANIFEST_PATH": "storage/manifest.json",         
        
        # Database and Protocols
        "CHR_SCHEMA_PATH": "protocols/chr_schema.json",
        "DATABASE_URI": "sqlite:///nexus_state.db",      
        
        # System Parameters for Learning Strategy
        "LOG_LEVEL": "INFO",
        "MUTATION_TEMPERATURE_DEFAULT": 0.7, 
        "STAGNATION_CYCLES_THRESHOLD": 5    
    }

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(SystemConfigManager, cls).__new__(cls)
            # Ensure __init__ runs only once
            cls._instance.initialized = False
        return cls._instance

    def __init__(self, config_file: str = "config/system_settings.json", _skip_init=False):
        if self.initialized and not _skip_init:
            return 
            
        self._config = self._DEFAULTS.copy()
        self._load_config_file(config_file)
        self._apply_environment_overrides()
        
        self.__class__._instance.initialized = True

    def _load_config_file(self, file_path: str):
        path = Path(file_path)
        if path.exists():
            try:
                with open(path, 'r') as f:
                    settings = json.load(f)
                    self._config.update(settings)
                logger.debug(f"Loaded configuration from {file_path}")
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"FATAL: Failed to load/parse configuration file {file_path}. Using defaults and ENV variables. Error: {e}")
        else:
            logger.debug(f"Configuration file {file_path} not found. Using internal defaults.")

    def _apply_environment_overrides(self):
        """Overrides configuration settings with matching environment variables, attempting type conversion."""
        for key in self._config.keys():
            env_val = os.getenv(key)
            if env_val is not None:
                # Basic type coercion for consistency
                try:
                    if env_val.lower() in ('true', 'false'):
                        self._config[key] = env_val.lower() == 'true'
                    elif env_val.isdigit():
                        self._config[key] = int(env_val)
                    elif '.' in env_val and env_val.replace('.', '', 1).isdigit():
                        self._config[key] = float(env_val)
                    else:
                        self._config[key] = env_val
                except Exception:
                    self._config[key] = env_val 
                    
                logger.debug(f"Overrode '{key}' with environment variable value: {self._config[key]}")

    def get_path(self, key: str) -> str:
        """Retrieves a configured path string, strictly ensuring it is a string."""
        value = self.get(key)
        if not isinstance(value, str):
             raise TypeError(f"Configuration key '{key}' expected path (string) but found type {type(value).__name__}.")
        return value

    def get(self, key: str):
        """Retrieves any configured value."""
        if key not in self._config:
            logger.warning(f"Attempted to access non-existent configuration key: '{key}'. Returning None.")
            return None
        return self._config[key]

    @classmethod
    def get_instance(cls):
        """Provides easy access to the configured Singleton instance."""
        if cls._instance is None or not getattr(cls._instance, 'initialized', False):
             # Initialize using the default file path if accessed via class method before standard init
             cls()
        return cls._instance