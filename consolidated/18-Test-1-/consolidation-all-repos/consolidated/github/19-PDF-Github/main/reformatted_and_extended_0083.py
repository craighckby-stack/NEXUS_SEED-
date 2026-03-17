import os
import json
import logging
from dataclasses import dataclass, field
from typing import Dict, Any, Optional

# Setup a basic internal logger (best practice)
LOG = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class ConfigLoadError(Exception):
    """Base exception for configuration loading issues."""
    pass

class FeatureNotFound(ConfigLoadError):
    """Raised when a specific feature config file is missing."""
    pass

class InvalidFeatureFormat(ConfigLoadError):
    """Raised when the JSON structure or types are incorrect."""
    pass


@dataclass(frozen=True)
class FeatureConfig:
    """Represents a configuration snippet for a single feature. Immutable."""
    name: str
    is_enabled: bool = field(default=False) # Use field for better typing control
    priority: int = field(default=100)
    settings: Dict[str, Any] = field(default_factory=dict)

    def get_setting(self, key: str, default: Any = None) -> Any:
        """Helper to safely retrieve nested settings."""
        return self.settings.get(key, default)


class ConfigurationManager:
    """
    Manages system configuration, ensuring immutable FeatureConfig objects.
    Uses centralized error handling via custom exceptions.
    """

    def __init__(self, base_path: str = "./config/"):
        self._config_path = base_path
        # Type enforcement for features map
        self._features: Dict[str, FeatureConfig] = {}
        self.load_initial_features()

    def _read_config_file(self, file_path: str) -> Dict[str, Any]:
        """Internal helper to read and parse the file."""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FeatureNotFound(f"File missing: {file_path}")
        except json.JSONDecodeError as e:
            raise InvalidFeatureFormat(f"Invalid JSON in {file_path}: {e}")

    def load_feature_config(self, feature_name: str) -> FeatureConfig:
        """
        Loads configuration for a specific feature from disk.
        Raises ConfigLoadError or its subclass on failure.
        """
        file_path = os.path.join(self._config_path, f"{feature_name}.json")
        data = self._read_config_file(file_path)

        try:
            # Explicit input validation during FeatureConfig creation
            return FeatureConfig(
                name=feature_name,
                is_enabled=bool(data.get('enabled', False)),
                priority=int(data.get('priority', 100)),
                settings=data.get('settings', {})
            )
        except (TypeError, ValueError) as e:
            # Catches issues if 'priority' isn't castable to int, etc.
            raise InvalidFeatureFormat(f"Type coercion error for {feature_name}: {e}")

    def load_initial_features(self, feature_list: Optional[list[str]] = None):
        """Loads a predefined set of critical features."""

        if feature_list is None:
            # Defining sensible default set for evolution tracking
            feature_list = ["core_v94", "logging_api", "telemetry_endpoint"]

        for name in feature_list:
            try:
                config = self.load_feature_config(name)
                self._features[name] = config
                LOG.info(f"Loaded feature configuration: {name}")
            except FeatureNotFound:
                LOG.warning(f"Skipping load: Feature configuration file not found for '{name}'")
            except ConfigLoadError as e:
                LOG.error(f"Failed to load/parse configuration for '{name}': {e}")
            except Exception as e:
                LOG.critical(f"Unhandled error during feature initialization of '{name}': {e}")


    def get_feature_settings(self, name: str) -> Optional[FeatureConfig]:
        """Retrieves an existing feature configuration."""
        return self._features.get(name)