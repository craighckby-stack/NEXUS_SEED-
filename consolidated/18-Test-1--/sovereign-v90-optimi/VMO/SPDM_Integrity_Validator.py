# VMO/SPDM_Integrity_Validator.py
import json
from datetime import datetime

class SPDMValidationException(Exception):
    """Custom exception raised when SPDM payload validation fails.
    This allows consuming systems to specifically catch validation errors
    rather than generic ValueErrors, aiding in integration and recovery protocols.
    """
    def __init__(self, message, errors):
        super().__init__(message)
        self.errors = errors
        self.error_summary = [f"{e.get('code', 'UNKNOWN')}: {e.get('message', 'Validation error')}" for e in errors]
        self.detailed_message = f"{message} ({len(self.error_summary)} errors found):\n" + "\n".join(self.error_summary)

    def __str__(self):
        return self.detailed_message

class SPDMIntegrityValidator:
    """
    Ensures incoming risk metric payloads (SPDM inputs) strictly adhere 
    to the VMO requirement schema (v2.0.0) before calculation starts.
    """
    def __init__(self, schema_path='config/SPDM_Schema.json'):
        self.schema_path = schema_path
        self.schema = self._load_schema()
        self.metric_defs = {m['id']: m for m in self.schema.get('metrics', [])}
        self.required_metrics = set(self.metric_defs.keys())

    def _load_schema(self):
        """Internal helper to load the configuration schema robustly and handle file errors."""
        try:
            with open(self.schema_path, 'r') as f:
                schema = json.load(f)
            return schema
        except FileNotFoundError:
            # Log critical warning to console, adhering to initial print behavior but with context
            print(f"KERNEL WARNING: SPDM Schema not found at {self.schema_path}. Proceeding with empty definition, validation will likely fail.")
            return {'metrics': []}
        except json.JSONDecodeError as e:
            # Handle corrupt schema file (new robustness feature)
            print(f"KERNEL ERROR: Failed to parse JSON schema at {self.schema_path}. Error: {e}. Using empty definition.")
            return {'metrics': []}

    def validate(self, payload: dict) -> dict:
        """
        Validates the incoming data structure, type, and required fields.
        Returns {'is_valid': bool, 'errors': list} for structured feedback.
        """
        errors = []
        
        # 1. Structural Validation
        if 'timestamp' not in payload:
            errors.append({'code': 'STRUCT_MISSING', 'field': 'timestamp', 'message': "Payload missing mandatory 'timestamp' key."})
        if 'metrics' not in payload:
            errors.append({'code': 'STRUCT_MISSING', 'field': 'metrics', 'message': "Payload missing mandatory 'metrics' dictionary."})

        # ISO 8601 validation
        if 'timestamp' in payload and isinstance(payload['timestamp'], str):
            try:
                # Use strict ISO format check, accommodating 'Z' suffix for UTC.
                datetime.fromisoformat(payload['timestamp'].replace('Z', '+00:00'))
            except ValueError:
                errors.append({'code': 'TYPE_INVALID', 'field': 'timestamp', 'value': payload.get('timestamp'), 'message': "Invalid timestamp format (must be ISO 8601)."})
        elif 'timestamp' in payload and not isinstance(payload['timestamp'], str):
             errors.append({'code': 'TYPE_INVALID', 'field': 'timestamp', 'value': payload.get('timestamp'), 'message': "Timestamp must be a string."})

        # Skip metric checks if core structure is fundamentally broken or metrics key is absent/not a dict
        if errors or not isinstance(payload.get('metrics'), dict):
            return {'is_valid': not bool(errors), 'errors': errors}

        incoming_metric_ids = set(payload['metrics'].keys())
        
        # 2. Metric Existence Check
        missing = self.required_metrics - incoming_metric_ids
        if missing:
            errors.append({'code': 'METRIC_MISSING', 'metrics': sorted(list(missing)), 'message': f"Payload missing required SPDM metrics: {list(missing)}"})

        # 3. Type Validation
        for mid, value in payload['metrics'].items():
            if mid not in self.metric_defs:
                # Allows extra metrics if robust filtering is implemented later
                continue 

            definition = self.metric_defs[mid]
            expected_type = definition['type']
            value_type = type(value).__name__

            is_valid_type = True

            if expected_type == 'float':
                # Accepts int as float for convenience
                if not isinstance(value, (float, int)):
                    is_valid_type = False
            elif expected_type == 'integer':
                # Must be strictly an integer, guards against boolean (which is subclass of int)
                if isinstance(value, bool) or not isinstance(value, int):
                    is_valid_type = False
            
            if not is_valid_type:
                errors.append({
                    'code': 'TYPE_MISMATCH', 
                    'metric': mid, 
                    'expected': expected_type, 
                    'received': value_type,
                    'message': f"Metric {mid} requires {expected_type}, got {value_type}"
                })
            
        return {'is_valid': not bool(errors), 'errors': errors}

    def get_validated_data(self, payload: dict) -> dict:
        """ Returns the payload if valid, raising a consolidated SPDMValidationException otherwise. """
        validation_result = self.validate(payload)
        
        if not validation_result['is_valid']:
            # Raise custom, structured exception
            raise SPDMValidationException(
                "SPDM Payload validation failed.",
                validation_result['errors']
            )
            
        return payload

# EOF