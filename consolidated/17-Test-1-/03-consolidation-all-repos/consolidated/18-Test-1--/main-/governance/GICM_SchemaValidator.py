import jsonschema
import json

def load_schema(path: str) -> dict:
    with open(path, 'r') as f:
        return json.load(f)

class GICMValidator:
    def __init__(self, schema_path: str = 'governance/GICM_Schema.json'):
        self.schema = load_schema(schema_path)

    def validate_document(self, data: dict, definition_key: str):
        """Validates a specific document against a named definition within the GICM Schema."""
        if definition_key not in self.schema['definitions']:
            raise ValueError(f"Definition '{definition_key}' not found in schema.")
        
        # Create a temporary schema root to enforce validation against the specific definition
        temp_schema = {
            '$schema': 'http://json-schema.org/draft-07/schema#',
            'definitions': self.schema['definitions'],
            **self.schema['definitions'][definition_key]
        }
        
        try:
            jsonschema.validate(instance=data, schema=temp_schema)
            return True
        except jsonschema.exceptions.ValidationError as e:
            raise ValueError(f"GICM Validation Error for {definition_key}: {e.message}")

# Example usage stub for runtime integration:
# validator = GICMValidator()
# new_policy = {'PolicyID': 'P_001A', ...}
# validator.validate_document(new_policy, 'PolicyDefinition')