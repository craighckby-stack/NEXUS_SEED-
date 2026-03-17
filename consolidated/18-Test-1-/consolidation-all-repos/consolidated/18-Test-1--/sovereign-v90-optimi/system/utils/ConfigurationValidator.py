from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class ConfigurationValidator:
    """
    Utility class responsible for validating loaded configuration data 
    against predefined internal schemas (or external JSON Schema definitions).
    Ensures configuration integrity before consumption by core system components.
    """

    # Example simplified internal schema definition
    CORE_SCHEMA = {
        "system.version": {"type": str, "required": True},
        "system.environment": {"type": str, "required": True, "options": ["dev", "prod", "test"]},
        "metrics.temm_schema": {"type": dict, "required": False}
    }

    @staticmethod
    def validate(config_data: Dict[str, Any]) -> bool:
        """
        Performs basic structural and type validation on the config data.
        """
        errors: List[str] = []

        # Implementation hook: Traverse the CORE_SCHEMA
        for path, rules in ConfigurationValidator.CORE_SCHEMA.items():
            keys = path.split('.')
            current = config_data
            found = True

            # Attempt to retrieve value using dot notation
            for key in keys:
                if isinstance(current, dict) and key in current:
                    current = current[key]
                else:
                    found = False
                    break

            if rules.get("required") and not found:
                errors.append(f"Missing required configuration key: {path}")
                continue
            
            if found: # If we found the key, check its type and options
                expected_type = rules.get("type")
                if expected_type and not isinstance(current, expected_type):
                    errors.append(f"Type mismatch for {path}: Expected {expected_type.__name__}, got {type(current).__name__}")
                
                allowed_options = rules.get("options")
                if allowed_options and current not in allowed_options:
                    errors.append(f"Invalid value for {path}: '{current}'. Must be one of {allowed_options}.")

        if errors:
            logger.error("Configuration validation failed:")
            for err in errors:
                logger.error(f"  -> {err}")
            return False
        
        logger.info("Configuration successfully validated.")
        return True
