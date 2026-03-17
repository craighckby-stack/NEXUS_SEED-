import json
from jsonschema import validate, ValidationError

class MECValidationEngine:
    def __init__(self, schema_path='schemas/MECSchemaDefinition.json'):
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)

    def validate_contract(self, contract_data):
        try:
            validate(instance=contract_data, schema=self.schema)
            print("MEC Validation: PASS")
            return True
        except ValidationError as e:
            print(f"MEC Validation: FAIL. Error: {e.message}")
            return False

# Usage example:
# engine = MECValidationEngine()
# result = engine.validate_contract(loaded_mec_instance_data)