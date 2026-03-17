import os
import yaml
from typing import Type, Union
from pydantic import BaseModel, ValidationError

# Assume schemas.system_config contains the definitions
# from schemas.system_config import SystemConfig

def load_config_from_file(file_path: str, config_schema: Type[BaseModel]) -> Union[BaseModel, None]:
    """Loads configuration data from a YAML file and validates it against a Pydantic schema.
    
    If 'yaml' is not available, 'json' is often interchangeable here.
    """
    if not os.path.exists(file_path):
        print(f"Warning: Configuration file not found at {file_path}. Using defaults/environment.")
        return None
        
    try:
        with open(file_path, 'r') as f:
            data = yaml.safe_load(f)
            
        # Environment variables and other overlays would typically happen here before validation
        
        config = config_schema.model_validate(data)
        print(f"Configuration loaded successfully from {file_path}.")
        return config
        
    except FileNotFoundError:
        print(f"Error: File not found: {file_path}")
        return None
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file {file_path}: {e}")
        return None
    except ValidationError as e:
        print(f"FATAL: Configuration validation failed for schema {config_schema.__name__}:\n{e}")
        raise SystemExit(1)
    except Exception as e:
        print(f"An unexpected error occurred during config loading: {e}")
        return None

# Example Usage (requires SystemConfig import):
# CONFIG_FILE = os.getenv('CONFIG_PATH', 'config/system.yaml')
# system_config = load_config_from_file(CONFIG_FILE, SystemConfig)
# if system_config is None:
#     # Fallback: Initialize config with pure defaults or environment variables
#     system_config = SystemConfig()