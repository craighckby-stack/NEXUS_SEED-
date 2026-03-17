import json
import re
from typing import Dict, Any, List, Tuple, Union, Optional

class ValidationError(Exception):
    def __init__(self, message: str, path: str, rule_type: str, level: str = "NORMAL"):
        self.message = message
        self.path = path
        self.rule_type = rule_type
        self.level = level
        super().__init__(f"[{level}] Validation Failure at '{path}' ({rule_type}): {message}")

class GSEPContractValidator:
    """Utility for rigorously validating GSEP payloads against defined contracts.
    
    Refactored to support structured error reporting, array item validation ('items'), 
    and extended constraints (minimum, maximum, minLength, maxLength).
    """
    
    TYPE_MAP: Dict[str, Union[type, Tuple[type, ...]]] = {
        "string": str,
        "number": (int, float),
        "integer": int,
        "boolean": bool,
        "object": dict,
        "array": list,
    }

    def __init__(self, contract_data: Dict[str, Any], expected_contract_id: str = "PPC-V2.0"):
        """Initializes the validator with pre-loaded contract data.
        
        Args:
            contract_data: The loaded schema definition.
            expected_contract_id: Allows configuration of the expected schema ID.
        """
        contract_id = contract_data.get('contract_id')
        if contract_id != expected_contract_id:
            raise ValueError(f"Schema mismatch: Loaded contract ID '{contract_id}' does not match expected ID '{expected_contract_id}'.")
            
        self.contract: Dict[str, Any] = contract_data
        self.schema: List[Dict[str, Any]] = self.contract.get("validation_schema", [])
        self.expected_id = expected_contract_id

    @classmethod
    def from_file(cls, contract_path: str, expected_contract_id: str = "PPC-V2.0") -> 'GSEPContractValidator':
        """Load contract data from a file path and initialize the validator (decouples I/O)."""
        try:
            with open(contract_path, 'r') as f:
                contract_data = json.load(f)
            return cls(contract_data, expected_contract_id=expected_contract_id)
        except FileNotFoundError:
            raise RuntimeError(f"Contract file not found at {contract_path}")
        except json.JSONDecodeError:
            raise RuntimeError(f"Failed to decode JSON from contract file at {contract_path}")

    def _apply_constraints(self, data: Any, constraints: Dict[str, Any], key_path: str, errors: List[ValidationError]) -> bool:
        """Applies primitive checks (type, pattern, range, length) on a single item. Returns True if structural recursion should be aborted."""
        expected_type_str = constraints.get("type")
        
        # 1. Type Check
        if expected_type_str and expected_type_str in self.TYPE_MAP:
            expected_py_type = self.TYPE_MAP[expected_type_str]
            
            if not isinstance(data, expected_py_type):
                errors.append(ValidationError(
                    message=f"Type mismatch. Expected '{expected_type_str}', got '{type(data).__name__}'.",
                    path=key_path,
                    rule_type="TypeCheck"
                ))
                # If type check fails, all subsequent constraint checks are unreliable.
                return True 

        # 2. Pattern Check
        if isinstance(data, str) and "pattern" in constraints:
            pattern = constraints["pattern"]
            try:
                if not re.match(pattern, data):
                    errors.append(ValidationError(
                        message=f"Value does not conform to regex '{pattern}'.",
                        path=key_path,
                        rule_type="PatternCheck"
                    ))
            except re.error:
                errors.append(ValidationError(
                    message=f"Invalid regex pattern '{pattern}' defined in schema.",
                    path=key_path,
                    rule_type="SchemaCritical"
                ))
        
        # 3. Numeric Constraints (Min/Max)
        if isinstance(data, (int, float)):
            if "minimum" in constraints and data < constraints["minimum"]:
                errors.append(ValidationError(
                    message=f"Value {data} is less than minimum required value {constraints['minimum']}.",
                    path=key_path,
                    rule_type="RangeCheck"
                ))

            if "maximum" in constraints and data > constraints["maximum"]:
                errors.append(ValidationError(
                    message=f"Value {data} is greater than maximum allowed value {constraints['maximum']}.",
                    path=key_path,
                    rule_type="RangeCheck"
                ))

        # 4. String Length Constraints (MinLength/MaxLength)
        if isinstance(data, str):
            length = len(data)
            
            if "minLength" in constraints and length < constraints["minLength"]:
                errors.append(ValidationError(
                    message=f"String length {length} is less than minimum length {constraints['minLength']}.",
                    path=key_path,
                    rule_type="LengthCheck"
                ))

            if "maxLength" in constraints and length > constraints["maxLength"]:
                errors.append(ValidationError(
                    message=f"String length {length} exceeds maximum length {constraints['maxLength']}.",
                    path=key_path,
                    rule_type="LengthCheck"
                ))
                    
        return False

    def _validate_recursive(self, data: Any, constraints: Dict[str, Any], key_path: str, errors: List[ValidationError]) -> None:
        """Recursively handles structural validation for objects ('definition') and arrays ('items')."""
        
        # Apply primitive constraints first. If the type check failed, stop recursion here.
        if self._apply_constraints(data, constraints, key_path, errors):
            return

        expected_type_str = constraints.get("type")
        definition = constraints.get("definition")
        items_constraints = constraints.get("items")
        
        # 1. Recursive Object Validation
        if expected_type_str == "object" and definition:
            if not isinstance(data, dict): return # Type check already passed, this is a safety check.

            for key, sub_constraints in definition.items():
                sub_key_path = f"{key_path}.{key}"
                required = sub_constraints.get("required", False)
                
                if key not in data:
                    if required:
                        errors.append(ValidationError(
                            message=f"Missing required sub-key.",
                            path=sub_key_path,
                            rule_type="PresenceCheck",
                            level="CRITICAL"
                        ))
                    continue
                
                # Recursive call for nested structure
                self._validate_recursive(data[key], sub_constraints, sub_key_path, errors)

        # 2. Array Item Validation
        if expected_type_str == "array" and items_constraints:
            if not isinstance(data, list): return # Type check already passed.
            
            for index, item_data in enumerate(data):
                item_path = f"{key_path}[{index}]"
                # Recursive call for array item structure
                self._validate_recursive(item_data, items_constraints, item_path, errors)


    def validate_payload(self, payload: Dict[str, Any]) -> Tuple[bool, List[ValidationError]]:
        """Validates the given payload against the internal schema rules, returning structured errors."""
        errors: List[ValidationError] = []

        for rule in self.schema:
            field_name: str = rule.get("field")
            level: str = rule.get("level", "NORMAL")
            required = rule.get("required", False) # Assuming GSEP schema can define required at top level
            
            # 1. Top-Level Field Presence Check
            if field_name not in payload:
                if required or level == "CRITICAL":
                    errors.append(ValidationError(
                        message=f"Missing required top-level field.",
                        path=field_name,
                        rule_type="PresenceCheck",
                        level=level
                    ))
                continue

            field_data = payload[field_name]
            
            # 2. Full Recursive Validation starting from top level rule
            self._validate_recursive(field_data, rule, field_name, errors)

        return len(errors) == 0, errors