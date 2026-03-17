import os
import yaml
from typing import Type, Union, Any, Dict
from pydantic import BaseModel, ValidationError

# --- Custom Exception Hierarchy for Abstraction ---

class ConfigError(Exception):
    """Base exception for configuration loading errors, allowing callers to handle all related issues."""
    pass

class ConfigParseError(ConfigError):
    """Error during YAML parsing."""
    pass

class ConfigValidationError(ConfigError):
    """Error during Pydantic schema validation."""
    
# --- Refactored Utility Function ---

def load_config_from_file(file_path: str, config_schema: Type[BaseModel]) -> Union[BaseModel, None]:
    """Loads configuration data from a YAML file and validates it against a Pydantic schema.
    
    Returns None if the file is not found. Raises specific ConfigError on parsing/validation failures.
    Optimized for efficiency by minimizing redundant I/O checks and utilizing Pydantic's fast validation core.
    """
    data: Dict[str, Any]
    
    try:
        # 1. I/O and Parsing: Rely on the efficient `open()` to handle FileNotFoundError
        with open(file_path, 'r') as f:
            # Use safe_load for secure parsing (essential trade-off)
            data = yaml.safe_load(f)
            
    except FileNotFoundError:
        # Consistent with original behavior: return None for missing configuration file
        return None 
        
    except yaml.YAMLError as e:
        # 2. Parsing Error Handling (Abstracted failure mode)
        raise ConfigParseError(f"Error parsing YAML file {file_path}: {e}") from None
    
    except Exception as e:
        # Catch unexpected I/O errors (e.g., permissions)
        raise ConfigError(f"An unexpected error occurred during file access or parsing: {e}") from None

    # 3. Validation: The computationally intensive core, utilizing optimized Pydantic v2 methods
    try:
        config = config_schema.model_validate(data)
        # Configuration loaded successfully.
        return config
        
    except ValidationError as e:
        # 4. Validation Error Handling (Abstracted failure mode)
        # Replaced SystemExit and internal prints with a structured exception for cleaner flow.
        raise ConfigValidationError(
            f"Configuration validation failed for schema {config_schema.__name__}:\n{e}"
        ) from None