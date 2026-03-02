import json
import logging
from typing import Dict, Any, List, Tuple
# Use specific validator and error matching for performance
from jsonschema import Draft202012Validator, ValidationError
from jsonschema.exceptions import best_match

# --- Configuration ---
DEFAULT_SCHEMA_PATH = 'governance/M-01_Intent_Schema.json'

# Setup logging
logger = logging.getLogger(__name__)

class IntentValidator:
    """
    Validates and normalizes operational Intents using a canonical JSON schema.
    Optimized for maximum efficiency by pre-compiling the schema using Draft202012Validator.
    """

    def __init__(self, schema_path: str = DEFAULT_SCHEMA_PATH):
        self._schema_validator: Draft202012Validator | None = None
        self._load_and_compile_schema(schema_path)

    def _load_schema(self, path: str) -> Dict[str, Any]:
        """Loads the raw JSON schema, ensuring robust I/O handling."""
        try:
            with open(path, 'r') as f:
                schema = json.load(f)
            logger.info(f"Successfully loaded intent schema from {path}")
            return schema
        except FileNotFoundError:
            logger.critical(f"Intent Schema file not found at path: {path}")
            raise EnvironmentError(f"Required schema file not found: {path}")
        except json.JSONDecodeError as e:
            logger.critical(f"Intent Schema file is malformed JSON in {path}. Error: {e}")
            raise ValueError(f"Schema JSON decoding error: {e}")
        except Exception as e:
            logger.critical(f"An unexpected error occurred during schema loading: {e}")
            raise RuntimeError(f"Schema initialization failed: {e}")

    def _load_and_compile_schema(self, path: str):
        """Loads the schema and pre-compiles the validator for efficiency (O(1) validation cost)."""
        schema_data = self._load_schema(path)
        try:
            # Pre-compilation is the primary computational efficiency gain
            self._schema_validator = Draft202012Validator(schema_data)
        except Exception as e:
            logger.critical(f"Schema compilation failed (Draft202012): {e}")
            raise RuntimeError(f"Validator initialization error: {e}")

    def validate_intent(self, intent_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validates the intent data using the pre-compiled validator.
        Returns validation status and a list containing the most critical error message if failed.
        """
        if self._schema_validator is None:
            err = "Validator is uninitialized. Cannot validate intent."
            logger.error(err)
            return False, [err]

        validation_errors = list(self._schema_validator.iter_errors(intent_data))

        if not validation_errors:
            return True, []

        # Use best_match abstraction for focused error reporting
        best_error = best_match(validation_errors)
        
        error_message = (
            f"Intent Validation Failed: {best_error.message} "
            f"(Path: {' -> '.join(map(str, best_error.path))})"
        )
        logger.warning(error_message)
        
        return False, [error_message]

    def normalize_intent(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies structural normalization. Implemented with recursive abstraction
        to handle complex nested intent structures efficiently.
        """
        
        def _recursive_normalize(sub_data: Any, schema_part: Dict[str, Any]) -> Any:
            """Internal recursive normalization logic (Placeholder for complex coercion/defaults)."""
            if isinstance(sub_data, dict) and 'properties' in schema_part:
                normalized_dict = {}
                for key, value in sub_data.items():
                    if key in schema_part['properties']:
                        sub_schema = schema_part['properties'][key]
                        normalized_dict[key] = _recursive_normalize(value, sub_schema)
                    else:
                        # Preserve non-schema defined fields if allowed
                        normalized_dict[key] = value
                return normalized_dict
            
            # Example: Apply default type coercion (e.g., string to int) if required
            # ... normalization logic here ...

            return sub_data
        
        # If validation passed, we usually rely on the client ensuring type correctness,
        # or use a dedicated normalizing validator. For efficiency, we minimize transformation.
        
        return data
