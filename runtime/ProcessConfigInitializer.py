import json
from jsonschema import validate, ValidationError, Draft202012Validator
from typing import Dict, Any

class ProcessConfigInitializer:
    """
    Validates, normalizes, and initializes task configuration based on the 
    AGCA_PCTM_V1 schema prior to runtime orchestration, leveraging the strict
    typing of the refactored schema.
    """
    
    def __init__(self, schema_content: Dict[str, Any]):
        # Use Draft202012Validator for robust schema compliance check
        self.validator = Draft202012Validator(schema_content)

    def validate_and_initialize(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validates configuration and applies necessary defaults/transformations."""
        
        # 1. Validation (early exit for failure)
        try:
            self.validator.validate(config)
        except ValidationError as e:
            raise RuntimeError(f"Invalid configuration based on PCTM schema: {e.message} at {list(e.path)}")

        # 2. Initialization and Default Application
        # (In a production system, this would involve applying defaults defined in the schema
        # using a specialized jsonschema default validator or a manual pass)
        
        # Ensure UUID fields are present (though schema should catch missing ones):
        if 'task_id' not in config: 
            raise ValueError("Task ID missing after validation pass.")

        return config
