import json
import logging
from jsonschema import validate, ValidationError
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

# Initialize module logger for robust error tracking
logger = logging.getLogger(__name__)

class ChronologyValidator:
    """
    Utility class for validating Chronology Records (CHR) against the formal protocol schema.
    Ensures data integrity across the Sovereign AGI system's runtime history layer.
    
    Refactored to allow schema initialization via dictionary or path, and to return
    detailed error feedback upon validation failure.
    """
    
    # Use a class-level constant for the default path, standardizing the location
    DEFAULT_SCHEMA_PATH = "protocol/chr_schema.json"

    def __init__(self, schema_source: Optional[Any] = None):
        """
        Initializes the validator.
        :param schema_source: Optional path string, Path object, or pre-loaded schema dictionary.
        """
        self.schema: Dict[str, Any]

        if isinstance(schema_source, dict):
            # Schema provided directly (useful for testing/dynamic configurations)
            self.schema = schema_source
            logger.debug("ChronologyValidator initialized with in-memory schema.")
        else:
            # Load from file (string path, Path object, or None)
            schema_file_path = Path(schema_source or self.DEFAULT_SCHEMA_PATH)
            
            if not schema_file_path.exists():
                error_msg = f"Required CHR schema file not found at {schema_file_path.resolve()}"
                logger.critical(error_msg)
                raise FileNotFoundError(error_msg)
            
            try:
                with open(schema_file_path, 'r', encoding='utf-8') as f:
                    self.schema = json.load(f)
                logger.info(f"ChronologyValidator initialized successfully using schema: {schema_file_path}")
            except json.JSONDecodeError as e:
                error_msg = f"Failed to parse valid JSON schema at {schema_file_path}: {e}"
                logger.critical(error_msg)
                raise RuntimeError(error_msg)
        
    def validate_record(self, record: dict) -> Tuple[bool, Optional[str]]:
        """
        Validates a single Chronology Record against the schema.
        Returns: (success: bool, error_message: str | None)
        """
        if not isinstance(record, dict):
            msg = f"Validation skipped: Input is not a dictionary ({type(record)}) starting with {str(record)[:50]}"
            logger.warning(msg)
            return False, msg
            
        try:
            validate(instance=record, schema=self.schema)
            return True, None
        except ValidationError as e:
            # Log detailed error information for critical integrity failures.
            record_id = record.get('uuid', record.get('timestamp', 'UNKNOWN_ID'))
            
            error_msg = (
                f"[CHR Protocol Breach] Validation failed on record '{record_id}'. "
                f"Error: {e.message}. Field Path: {list(e.path)}"
            )
            
            logger.error(error_msg)
            return False, error_msg