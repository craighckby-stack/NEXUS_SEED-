# utilities/configuration_schema_validator.py

import os
import yaml
import json
from jsonschema import validate, ValidationError

# --- Custom Exception Hierarchy ---

class ConfigurationError(Exception):
    """Base exception for configuration related issues (loading/mapping)."""
    pass

class SchemaNotFoundError(ConfigurationError):
    """Raised when a required schema file or mapping is unavailable."""
    def __init__(self, message, artifact_name: str = None, lookup_path: str = None):
        super().__init__(message)
        self.artifact_name = artifact_name
        self.lookup_path = lookup_path

class ConfigurationFileError(ConfigurationError):
    """Raised when the configuration file cannot be read or parsed."""
    def __init__(self, message, file_path: str = None):
        super().__init__(message)
        self.file_path = file_path

class ConfigurationIntegrityError(ValidationError):
    """Custom validation failure tailored for GAX compliance (P-M02/G0)."""
    def __init__(self, original_error: ValidationError, config_path: str, artifact_name: str):
        message = (
            f"[GAX Integrity Exhaustion: P-M02/G0] Validation Failed for '{config_path}' "
            f"(Artifact: {artifact_name}). Detail: {original_error.message}"
        )
        # Preserve core ValidationError properties by forwarding them
        super().__init__(
            message=message,
            validator=original_error.validator,
            path=original_error.path,
            schema=original_error.schema,
            instance=original_error.instance,
            cause=original_error,
            context=original_error.context
        )
        self.config_path = config_path
        self.artifact_name = artifact_name

# ----------------------------------

class ConfigurationSchemaValidator:
    """ 
    Enforces GAX governance standards by validating all core configuration 
    artifacts against defined JSON schemas using a centralized master index.
    
    Implements schema caching for efficiency.
    """
    
    # Supported file types and their loading functions
    LOADERS = {
        '.json': json.load,
        '.yaml': yaml.safe_load,
        '.yml': yaml.safe_load,
    }

    def __init__(self, gax_master_spec_path: str):
        """
        Initializes the validator by loading the centralized schema index.
        """
        if not os.path.exists(gax_master_spec_path):
            raise FileNotFoundError(
                f"[GAX Integrity Failure] Master Spec index not found at {gax_master_spec_path}"
            )
            
        try:
            with open(gax_master_spec_path, 'r', encoding='utf-8') as f:
                # Assuming the index maps artifact names to schema file paths
                self.gax_master_schema_index = yaml.safe_load(f)
        except Exception as e:
            raise ConfigurationFileError(
                f"Failed to load GAX Master Schema Index from {gax_master_spec_path}: {e}",
                file_path=gax_master_spec_path
            )

        # Infer the schema root directory from the master index location using absolute path
        self.schema_directory = os.path.dirname(os.path.abspath(gax_master_spec_path))
        self._schema_cache = {}

    def _get_schema(self, artifact_name: str) -> dict:
        """
        Retrieves the validation schema, using a cache if already loaded.
        """
        if artifact_name in self._schema_cache:
            return self._schema_cache[artifact_name]
            
        schema_path_relative = self.gax_master_schema_index.get(artifact_name, None)
        
        if not schema_path_relative:
            raise SchemaNotFoundError(
                f"Artifact type '{artifact_name}' not mapped in GAX Master Spec index.",
                artifact_name=artifact_name
            )
            
        full_path = os.path.join(self.schema_directory, schema_path_relative)
        
        if not os.path.exists(full_path):
             raise SchemaNotFoundError(
                f"Schema file defined for '{artifact_name}' not found.",
                artifact_name=artifact_name,
                lookup_path=full_path
            )

        try:
            # Use yaml.safe_load for robustness against both JSON and YAML schemas
            with open(full_path, 'r', encoding='utf-8') as f:
                schema_content = yaml.safe_load(f)
                if not isinstance(schema_content, dict):
                    raise ValueError("Schema content is malformed or empty (not a root object).")
            
            self._schema_cache[artifact_name] = schema_content
            return schema_content
        except Exception as e:
            raise ConfigurationFileError(
                f"Error loading schema file {full_path}: {e}", 
                file_path=full_path
            ) from e


    def validate_configuration(self, config_artifact_path: str, artifact_name: str) -> bool:
        """
        Validates a specific configuration artifact against its predefined schema.
        
        Args:
            config_artifact_path: Full path to the configuration file.
            artifact_name: The conceptual name used for schema lookup.
            
        Returns:
            True if validation succeeds.
            
        Raises:
            ConfigurationIntegrityError: If the configuration violates the schema.
            ConfigurationError: If loading or schema mapping fails.
        """
        
        # 1. Determine loader based on file extension
        _, ext = os.path.splitext(config_artifact_path)
        loader = self.LOADERS.get(ext.lower())

        if not loader:
            raise ConfigurationFileError(
                f"Unsupported configuration file extension: {ext}", 
                file_path=config_artifact_path
            )

        # 2. Load Configuration Data
        try:
            with open(config_artifact_path, 'r', encoding='utf-8') as f:
                config_data = loader(f)
        except Exception as e:
            raise ConfigurationFileError(
                f"Failed to load/parse artifact {config_artifact_path} as {ext} file: {e}",
                file_path=config_artifact_path
            ) from e

        # 3. Retrieve Schema (handles caching)
        schema = self._get_schema(artifact_name) 
        
        # 4. Perform Validation
        # Removed internal print statements, relying on external logging/exception reporting.
        
        try:
            validate(instance=config_data, schema=schema)
            return True
            
        except ValidationError as e:
            # Wrap the standard ValidationError with compliance context
            raise ConfigurationIntegrityError(
                original_error=e,
                config_path=config_artifact_path,
                artifact_name=artifact_name
            ) from e

# Note: This component is mandatory for GSEP-C Gate G0 execution integrity check.