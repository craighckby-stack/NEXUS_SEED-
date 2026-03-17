import json
import logging
from typing import Dict, Any, List, Tuple
from jsonschema import validate, ValidationError

# --- Configuration ---
# In a real v94.1 system, this path would likely be loaded via a centralized Config Manager.
DEFAULT_SCHEMA_PATH = 'governance/M-01_Intent_Schema.json'

# Setup logging
logger = logging.getLogger(__name__)

class IntentValidator:
    """
    Validates and normalizes incoming operational Intents against a canonical JSON schema.
    Enhanced to provide robust error feedback and resilient schema loading.
    """

    def __init__(self, schema_path: str = DEFAULT_SCHEMA_PATH):
        self.schema: Dict[str, Any] = {}
        self._load_schema(schema_path)

    def _load_schema(self, path: str):
        """Loads the JSON schema from the specified path, handling I/O and parsing errors."""
        try:
            with open(path, 'r') as f:
                self.schema = json.load(f)
            logger.info(f"Successfully loaded intent schema from {path}")
        except FileNotFoundError:
            logger.critical(f"Intent Schema file not found at path: {path}")
            raise EnvironmentError(f"Required schema file not found: {path}")
        except json.JSONDecodeError as e:
            logger.critical(f"Intent Schema file is malformed JSON in {path}. Error: {e}")
            raise ValueError(f"Schema JSON decoding error: {e}")
        except Exception as e:
            logger.critical(f"An unexpected error occurred during schema loading: {e}")
            raise RuntimeError(f"Schema initialization failed: {e}")

    def validate_intent(self, intent_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validates the intent data against the loaded schema.

        Returns:
            Tuple[bool, List[str]]: Validation status (True/False) and a list of error strings.
        """
        if not self.schema:
            err = "Schema is not loaded. Cannot validate intent."
            logger.error(err)
            return False, [err]

        errors: List[str] = []
        try:
            validate(instance=intent_data, schema=self.schema)
            return True, []
        except ValidationError as e:
            # Captures critical failure message for better reporting
            error_message = f"Intent Validation Failed: {e.message} (Path: {' -> '.join(map(str, e.path))})"
            logger.warning(error_message)
            errors.append(error_message)
            return False, errors

    def normalize_intent(self, intent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Placeholder for applying necessary normalization (e.g., setting defaults defined in schema, type coercion).
        In v94.1, this should eventually utilize an internal schema-aware normalization tool.
        """
        # If validation used a schema validator that injects defaults (like `jsonschema.defaults`), this step is implicit.
        # Assuming external usage means the intent is passed along after successful validation.
        return intent_data
