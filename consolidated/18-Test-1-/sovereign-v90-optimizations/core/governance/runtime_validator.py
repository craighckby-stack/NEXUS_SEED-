from typing import Any, Callable, Dict, Optional, Type, Union


class ConfigRuntimeValidator:
    """
    Ensures all governance constants adhere to defined constraints during system 
    initialization or hot reload. Utilizes a structured handler approach for 
    extensible and robust constraint checking.

    The main validation logic explicitly separates the 'required' check to ensure
    clear failure pathways before checking other constraints like type or range.
    """

    def __init__(self):
        # Expanded type map for standard Python types
        self._type_map: Dict[str, Type] = {
            'int': int, 
            'float': float, 
            'str': str, 
            'bool': bool, 
            'list': list, 
            'dict': dict,
            'set': set,
            'tuple': tuple
        }
        
        # Define constraint handlers (excluding 'required', which is handled in validate()) 
        self._constraint_handlers: Dict[str, Callable] = {
            'min': self._validate_min,
            'max': self._validate_max,
            'type': self._validate_type,
        }

    def _format_location(self, domain: str, key: str, symbol: str) -> str:
        """Formats the location identifier for clear error reporting."""
        return f"[{domain}].{key} ({symbol})"

    # --- Constraint Handlers ---

    def _validate_required(self, value: Any, constraint: bool, location: str) -> Optional[str]:
        """Validates if a constant is required and present."""
        if constraint is True and value is None:
            return f"CRITICAL: {location} is required but its value is None or missing."
        return None

    def _validate_min(self, value: Any, constraint: Union[int, float], location: str) -> Optional[str]:
        """Validates the minimum acceptable numerical value."""
        if isinstance(value, (int, float)):
            if value < constraint:
                return f"CRITICAL: {location} ({value}) below required minimum ({constraint})."
        return None

    def _validate_max(self, value: Any, constraint: Union[int, float], location: str) -> Optional[str]:
        """Validates the maximum acceptable numerical value."""
        if isinstance(value, (int, float)):
            if value > constraint:
                return f"CRITICAL: {location} ({value}) above required maximum ({constraint})."
        return None
    
    def _validate_type(self, value: Any, constraint: str, location: str) -> Optional[str]:
        """Validates the type of the constant."""
        if value is None:
            # If it passed the 'required' check (or wasn't required), we skip type check on None.
            return None
            
        expected_type = self._type_map.get(constraint)
        
        if not expected_type:
            # Indicates a faulty constraint definition itself
            return f"INTERNAL ERROR: {location} specified unknown type constraint '{constraint}'."

        if not isinstance(value, expected_type): 
            return f"CRITICAL: {location} expected type '{constraint}' but got '{type(value).__name__}' with value '{repr(value)}'."
        return None

    # --- Main Validation Logic ---

    def validate(self, constants_dict: Dict[str, Dict[str, Dict[str, Any]]]) -> bool:
        """Runs the complete validation suite against the system constants dictionary."""
        violations = []
        
        # Dynamically retrieve SystemGovernanceError, failing to standard RuntimeError if missing
        try:
            from core.governance.errors import SystemGovernanceError
        except ImportError:
            SystemGovernanceError = RuntimeError 

        for domain, items in constants_dict.items():
            if domain == 'system_meta':
                continue

            for key, definition in items.items():
                value: Any = definition.get('value')
                constraints: Dict[str, Any] = definition.get('constraints', {})
                symbol: str = definition.get('symbol', key)
                
                location = self._format_location(domain, key, symbol)
                
                # 1. CRITICAL CHECK: Required validation 
                is_required = constraints.get('required', False)
                error_required = self._validate_required(value, is_required, location)

                if error_required:
                    violations.append(error_required)
                    # If required fails, skip all subsequent checks for this item
                    continue 

                # 2. STANDARD CHECKS: Run only if the value is present OR if the required check passed (value is allowed to be None)
                if value is not None or not is_required:
                    for constraint_key, constraint_value in constraints.items():
                        
                        if constraint_key == 'required':
                            continue
                            
                        handler = self._constraint_handlers.get(constraint_key)
                        
                        if handler:
                            error = handler(value, constraint_value, location)
                            if error:
                                violations.append(error)
                        

        if violations:
            raise SystemGovernanceError(
                f"System Governance Constraint Violations Detected ({len(violations)} errors):\n - " + 
                "\n - ".join(violations)
            )
            
        return True