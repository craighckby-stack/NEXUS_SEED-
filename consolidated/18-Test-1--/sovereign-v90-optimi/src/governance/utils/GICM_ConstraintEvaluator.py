import re
from typing import Any, Dict, List, Union, Optional
from uuid import UUID

# Internal Type Definition used by the enforcement engine
Violation = Dict[str, Union[str, Any, None]]

class GICMConstraintEvaluator:
    """
    Provides static methods for checking specific JSON schema data constraints
    (length, pattern, format, range) external to the main enforcement loop.
    
    The main GICMEnforcementEngine will delegate specialized constraint checks here.
    """

    @staticmethod
    def check_min_max_length(field_name: str, value: Union[str, list], props: Dict[str, Any]) -> Optional[Violation]:
        """Checks string length or array size constraints (minLength, maxLength)."""
        if not isinstance(value, (str, list)):
            return None
            
        current_len = len(value)
        min_len = props.get('minLength')
        max_len = props.get('maxLength')

        if min_len is not None and current_len < min_len:
            return {
                "code": "CONSTRAINT_MIN_LENGTH",
                "message": f"Length violation: Field '{field_name}' must be at least {min_len} characters/items (found {current_len}).",
                "field": field_name
            }
        
        if max_len is not None and current_len > max_len:
            return {
                "code": "CONSTRAINT_MAX_LENGTH",
                "message": f"Length violation: Field '{field_name}' must be at most {max_len} characters/items (found {current_len}).",
                "field": field_name
            }
        
        return None

    @staticmethod
    def check_format(field_name: str, value: str, field_format: str) -> Optional[Violation]:
        """Validates specific predefined formats (e.g., email, uuid, date-time)."""
        if not isinstance(value, str):
            return None
            
        if field_format == 'uuid':
            try:
                UUID(value, version=4) # Assuming UUID v4 requirement for AGI identifiers
            except ValueError:
                return {
                    "code": "CONSTRAINT_FORMAT_UUID",
                    "message": f"Format error: Field '{field_name}' must be a valid UUID v4 string.",
                    "field": field_name
                }
                
        elif field_format == 'email':
            # Simple standard compliance check
            if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" , value):
                return {
                    "code": "CONSTRAINT_FORMAT_EMAIL",
                    "message": f"Format error: Field '{field_name}' is not a valid email address.",
                    "field": field_name
                }

        # Add 'date-time' or other standardized checks here
            
        return None

    @staticmethod
    def check_pattern(field_name: str, value: str, pattern: str) -> Optional[Violation]:
        """Validates string against a regex pattern defined in the 'pattern' constraint."""
        if not isinstance(value, str):
            return None
            
        try:
            if not re.match(pattern, value):
                 return {
                    "code": "CONSTRAINT_PATTERN_VIOLATION",
                    "message": f"Pattern mismatch: Field '{field_name}' failed validation against required regex pattern.",
                    "field": field_name,
                    "pattern": pattern
                }
        except re.error as e:
             # Log or handle invalid regex definition
             return {
                "code": "CONFIG_INVALID_PATTERN",
                "message": f"Configuration error: Invalid regex pattern provided for field '{field_name}'. Error: {e}",
                "field": field_name,
                "pattern": pattern
            }
        return None
