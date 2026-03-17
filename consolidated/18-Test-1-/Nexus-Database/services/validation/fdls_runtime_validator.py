import json
import logging
from jsonschema import validate, ValidationError, SchemaError
from typing import Any, Dict, Tuple, Optional

# Initialize a standard logger
logger = logging.getLogger(__name__)

class FDLSRuntimeValidator:
    """
    Validates payloads against the Formal Data Logic Specification (FDLS) schema.

    NOTE: In an advanced architecture, schema loading logic (in _load_schema)
    should be migrated to a dedicated SchemaLoader utility.
    """
    
    def __init__(self, fdls_spec_path: str):
        """
        Initializes the validator by loading the FDLS schema definition.
        Raises RuntimeError on file/JSON decoding/schema structure issues.
        """
        self.schema: Dict[str, Any] = self._load_schema(fdls_spec_path)
        logger.info("FDLS Runtime Validator initialized.")

    def _load_schema(self, path: str) -> Dict[str, Any]:
        """Handles robust schema loading internally."""
        try:
            with open(path, 'r') as f:
                spec = json.load(f)
            
            # Assuming the schema definition is nested under this key based on original context
            schema = spec.get('schema_definition')
            
            if schema is None:
                raise SchemaError(f"Specification file {path} missing 'schema_definition' key.")
            
            return schema

        except FileNotFoundError:
            logger.critical(f"FDLS schema file not found at: {path}")
            raise RuntimeError("Initialization Failed: Required FDLS schema not found.")
        except json.JSONDecodeError:
            logger.critical(f"Error decoding JSON in FDLS schema file {path}.")
            raise RuntimeError("Initialization Failed: Invalid JSON format in schema file.")
        except SchemaError as e:
             raise RuntimeError(f"Initialization Failed: Invalid FDLS specification: {e}")


    def validate_payload(self, payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Validates a raw FDLS payload against the formal schema definition.

        Returns: (success: bool, error_message: Optional[str])
        """
        try:
            validate(instance=payload, schema=self.schema)
            return True, None
        except ValidationError as e:
            # Provide high-fidelity error pathing and message
            path_str = '/'.join(map(str, e.path))
            error_msg = (
                f"Validation Failed: {e.message} "
                f"[Path: /{path_str}]"
            )
            logger.warning(error_msg)
            return False, error_msg
        except Exception as e:
            # Catch internal library issues for extreme robustness
            internal_error = f"Unexpected validation error during runtime: {type(e).__name__} - {str(e)}"
            logger.error(internal_error)
            return False, internal_error
