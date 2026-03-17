import json
import logging
from typing import Dict, Any
from jsonschema import SchemaError

logger = logging.getLogger(__name__)

class SchemaLoader:
    @staticmethod
    def load_schema_from_path(path: str, schema_key: str) -> Dict[str, Any]:
        """
        Centralized utility to load, parse, and verify the containment of a JSON schema 
        from a filesystem path, raising specific configuration errors.

        This method abstracts I/O, allowing FDLSRuntimeValidator to focus purely on validation.
        """
        logger.debug(f"Attempting to load schema from: {path} using key: {schema_key}")
        try:
            with open(path, 'r') as f:
                spec = json.load(f)
            
            schema = spec.get(schema_key)

            if schema is None:
                raise SchemaError(f"Specification file {path} missing required key '{schema_key}'.")
            
            logger.info(f"Successfully loaded schema definition.")
            return schema

        except FileNotFoundError:
            logger.critical(f"Schema file not found: {path}")
            raise RuntimeError("Configuration failure: Schema file not found.")
        except json.JSONDecodeError:
            logger.critical(f"Error decoding JSON in schema file {path}.")
            raise RuntimeError("Configuration failure: Invalid JSON format.")
        except SchemaError as e:
             logger.critical(str(e))
             raise RuntimeError(f"Configuration failure: Invalid specification format: {e}")
