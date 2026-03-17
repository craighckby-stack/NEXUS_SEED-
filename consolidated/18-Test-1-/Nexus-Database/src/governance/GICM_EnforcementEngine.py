import json
import logging
from typing import Dict, Any, List, Type, Union, Optional
from datetime import datetime
import re # Added for future format validation potential

# --- Configuration & Setup ---
# Using __name__ ensures context is maintained if this module is imported
logger = logging.getLogger(__name__)

# Custom Exceptions for clarity
class GICMSchemaError(Exception):
    """Base exception for GICM schema issues."""
    pass

class GICMSetupError(GICMSchemaError):
    """Raised when the GICM schema cannot be loaded or is invalid."""
    pass

# Internal Type Definition
Violation = Dict[str, Union[str, Any, None]] # Standardizing violation record structure

class GICMEnforcementEngine:

    # Map GICM/JSON Schema types to Python types
    TYPE_MAP: Dict[str, Type] = {
        'string': str,
        'integer': int,
        'number': (int, float),
        'boolean': bool,
        'array': list,
        'object': dict
    }

    def __init__(self, schema_path: str = "config/governance/GICM_Schema.json", violation_logger: Optional[Any] = None):
        """Initializes the enforcement engine by loading the GICM schema."""
        self.schema_path = schema_path
        self.schema: Dict[str, Any] = self._load_schema()
        
        self.entities: Dict[str, Any] = self.schema.get('entities', {})
        self.global_policies: Dict[str, Any] = self.schema.get('global_policies', {})

        # Violation logger (Dependency Injection)
        self.violation_logger = violation_logger

        if not self.entities:
            logger.warning(f"GICM Schema loaded but contains no entities: {schema_path}")

    def _load_schema(self) -> Dict[str, Any]:
        """Loads and validates the JSON schema file, raising GICMSetupError on failure."""
        try:
            with open(self.schema_path, 'r') as f:
                schema = json.load(f)

            # Strict structural validation
            missing_keys = [k for k in ['entities', 'global_policies'] if k not in schema]
            if missing_keys:
                key_str = ', '.join(missing_keys)
                logger.error(f"Schema file is structurally incomplete. Missing core keys: {key_str}.")
                raise GICMSetupError(f"Schema missing core keys ({key_str}).")

            return schema
        except FileNotFoundError:
            logger.critical(f"GICM Schema file not found: {self.schema_path}")
            raise GICMSetupError(f"Schema file missing: {self.schema_path}")
        except json.JSONDecodeError as e:
            logger.critical(f"GICM Schema file is invalid JSON: {self.schema_path}. Error: {e}")
            raise GICMSetupError(f"Invalid JSON schema: {self.schema_path}")
        except Exception as e:
            logger.critical(f"Unexpected error loading schema: {e}")
            raise GICMSetupError(f"Unexpected load error: {e}")

    def _check_type_compatibility(self, field_name: str, value: Any, expected_type_str: str) -> Optional[Violation]:
        """Internal helper to validate the data type based on TYPE_MAP."""
        expected_type_py = self.TYPE_MAP.get(expected_type_str)

        if expected_type_py is None:
             return {
                "code": "CONFIG_TYPE_UNKNOWN",
                "message": f"Unsupported GICM type '{expected_type_str}' defined for field '{field_name}'.",
                "field": field_name
            }

        if not isinstance(value, expected_type_py):
            return {
                "code": "DATA_TYPE_MISMATCH",
                "message": (f"Type mismatch: Field '{field_name}' expected {expected_type_str} "
                            f"(found {type(value).__name__})."),
                "field": field_name
            }
        return None

    def _check_field_constraints(self, field_name: str, value: Any, props: Dict[str, Any]) -> List[Violation]:
        """Checks specific constraints like enum, format, min/max length/value. (Optimized for ConstraintEvaluator integration later)."""
        violations: List[Violation] = []

        # --- Enumeration Check ---
        allowed_values = props.get('enum')
        if allowed_values and value is not None and value not in allowed_values:
            violations.append({
                "code": "CONSTRAINT_ENUM_VIOLATION", 
                "message": f"Value violation: Field '{field_name}' must be one of {allowed_values}.",
                "field": field_name,
                "current_value": value
            })

        # --- Range Check (Numbers) ---
        if isinstance(value, (int, float)):
            if props.get('minimum') is not None and value < props['minimum']:
                 violations.append({"code": "CONSTRAINT_MIN_VALUE", "message": f"Value of {field_name} ({value}) is below minimum requirement ({props['minimum']}).", "field": field_name})
            if props.get('maximum') is not None and value > props['maximum']:
                 violations.append({"code": "CONSTRAINT_MAX_VALUE", "message": f"Value of {field_name} ({value}) is above maximum requirement ({props['maximum']}).", "field": field_name})

        # Future: Call dedicated ConstraintEvaluator utility here for length, format, and pattern checks.
        
        return violations

    def _validate_entity_rules(self, entity_name: str, entity_def: Dict[str, Any], record: Dict[str, Any]) -> List[Violation]:
        """
        Executes entity-level integrity rules and cross-field policy checks, 
        now designed to look up custom rules for future dynamic execution.
        """
        violations: List[Violation] = []
        
        custom_rules = entity_def.get('custom_integrity_rules', [])
        
        # Example: GICM_AUDIT_L5_REQ rule enforcement
        for rule in custom_rules:
            rule_id = rule.get('rule_id')
            
            if rule_id == 'GICM_AUDIT_L5_REQ':
                if record.get('governance_level') == 'L5_Critical' and not record.get('audit_required_policy'):
                    violations.append({
                        "code": rule_id,
                        "message": "L5_Critical entities require 'audit_required_policy' linkage for audit trail integrity.",
                        "field": "audit_required_policy",
                        "entity": entity_name
                    })
                     
        return violations


    def validate_entity(self, entity_name: str, record: Dict[str, Any]) -> tuple[bool, List[Violation]]:
        """Validates a data record against its defined GICM entity schema."""

        entity_def = self.entities.get(entity_name)

        if not entity_def:
            return False, [{
                "code": "ENTITY_UNKNOWN", 
                "message": f"Unknown governance entity configuration: {entity_name}", 
                "field": None
            }]

        all_violations: List[Violation] = []
        defined_fields = entity_def.get('fields', {})
        # Use a configurable identifier key, defaulting to 'id'
        record_id = record.get(entity_def.get('identifier_key', 'id'), 'N/A')

        # 1. Field Integrity Checks (Required, Type, Constraints)
        for field, props in defined_fields.items():
            value = record.get(field)

            # A. Required Check (Stricter: Checks for key presence and non-None value)
            if props.get('required'):
                if field not in record or value is None:
                    all_violations.append({"code": "FIELD_MISSING_REQUIRED", "message": f"Missing required field: {field}", "field": field})
                    continue 

            # B. Type Check
            if value is not None and props.get('type'):
                type_violation = self._check_type_compatibility(field, value, props['type'])
                if type_violation:
                    all_violations.append(type_violation)
                    # Note: We still proceed to constraint checks if applicable, but often best practice is to skip.
            
            # C. Constraint Check (Only run if value is present)
            if value is not None:
                all_violations.extend(self._check_field_constraints(field, value, props))


        # 2. Entity-Level Integrity Rules (Cross-field dependencies)
        all_violations.extend(self._validate_entity_rules(entity_name, entity_def, record))
                     
        # 3. Overall Integrity Model Assessment (Post-Check Metadata)
        if all_violations and entity_def.get('integrity_model'):
            all_violations.insert(0, {
                "code": "INTEGRITY_COMPROMISED", 
                "message": f"Integrity model '{entity_def['integrity_model']}' requirements compromised (Total issues: {len(all_violations)}).",
                "field": None,
                "record_id": record_id,
                "timestamp": datetime.now().isoformat()
            })

        return not all_violations, all_violations

    def enforce_policy(self, violation_data: List[Violation], entity_name: str, record_identifier: str = "N/A"):
        """
        Triggers external enforcement hooks and logging based on violation data.
        """
        if not violation_data:
            return

        logger.warning(f"GICM Enforcement triggered for entity '{entity_name}'. Total Violations: {len(violation_data)}")
        
        # 1. Structured Logging
        if self.violation_logger and hasattr(self.violation_logger, 'log_violations'):
            try:
                self.violation_logger.log_violations(entity_name, record_identifier, violation_data)
                logger.debug(f"Violations logged successfully by external logger.")
            except Exception as e:
                logger.error(f"Failed to log violations using provided logger: {e}", exc_info=True)
                
        # 2. Critical Enforcement Hook Integration
        critical_codes = self.global_policies.get('critical_violation_codes', ["INTEGRITY_COMPROMISED", "GICM_AUDIT_L5_REQ"])
        is_critical = any(v.get('code') in critical_codes for v in violation_data)
        
        if is_critical:
            hook_config = self.global_policies.get('critical_alert_hook', {})
            hook_name = hook_config.get('handler')
            
            if hook_name:
                logger.critical(f"[GICM ALERT: {hook_name}] CRITICAL integrity breach detected. Entity: {entity_name}, Record: {record_identifier}.")
                # Placeholder: Hook execution logic would be triggered here.
            else:
                logger.critical(f"Critical violation detected but no 'critical_alert_hook' handler configured.")
        else:
             logger.info(f"Standard GICM violation recorded for {entity_name}.")
