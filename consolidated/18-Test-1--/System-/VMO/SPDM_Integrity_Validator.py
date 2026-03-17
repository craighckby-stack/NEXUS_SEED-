# VMO/SPDM_Integrity_Validator.py
import json
from datetime import datetime

class SPDMIntegrityValidator:
    """
    Ensures incoming risk metric payloads (SPDM inputs) strictly adhere 
    to the VMO requirement schema (v2.0.0) before calculation starts.
    """
    def __init__(self, schema_path='config/SPDM_Schema.json'):
        # Dynamically loads the schema to enforce real-time adherence
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)
        self.metric_defs = {m['id']: m for m in self.schema['metrics']}
        self.required_metrics = set(self.metric_defs.keys())

    def validate(self, payload: dict) -> bool:
        """
        Validates the incoming data structure, type, and required fields.
        Payload must include 'timestamp' and a 'metrics' dictionary.
        """
        
        # 1. Structural Validation
        if 'timestamp' not in payload or 'metrics' not in payload:
            raise ValueError("Payload missing mandatory 'timestamp' or 'metrics' keys.")

        try:
            datetime.fromisoformat(payload['timestamp'].replace('Z', '+00:00'))
        except ValueError:
            raise TypeError(f"Invalid timestamp format in payload: {payload['timestamp']}")

        incoming_metric_ids = set(payload['metrics'].keys())
        
        # 2. Metric Existence Check
        missing = self.required_metrics - incoming_metric_ids
        if missing:
            raise ValueError(f"Payload missing required SPDM metrics: {missing}")

        # 3. Type Validation
        for mid, value in payload['metrics'].items():
            if mid not in self.metric_defs:
                # Allows extra metrics if robust filtering is implemented later
                continue 

            definition = self.metric_defs[mid]
            
            if definition['type'] == 'float' and not isinstance(value, (float, int)):
                raise TypeError(f"Metric {mid} requires float/int, got {type(value).__name__}")
            elif definition['type'] == 'integer' and not isinstance(value, int):
                # Float conversion is explicitly disallowed for integers to enforce audit precision
                raise TypeError(f"Metric {mid} requires integer, got {type(value).__name__}")
            
        return True

    def get_validated_data(self, payload: dict) -> dict:
        """ Returns the payload if valid, raising an exception otherwise. """
        self.validate(payload)
        return payload

# EOF