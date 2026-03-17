import json
from jsonschema import validate, ValidationError, Draft7Validator

class PolicySchemaValidator:
    """Utility for validating policy configuration against the formal PGE Policy Structure Schema."""
    def __init__(self, schema_path: str):
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)
        self.validator = Draft7Validator(self.schema)

    def validate_policy(self, policy_data: dict) -> bool:
        try:
            self.validator.validate(policy_data)
            return True
        except ValidationError as e:
            print(f"Policy Validation Error: {e.message}")
            print(f"Path: {list(e.path)}")
            return False

    def validate_policies_list(self, policies_list: list) -> list:
        invalid_policies = []
        for policy in policies_list:
            if not self.validate_policy(policy):
                invalid_policies.append(policy.get('policy_id', 'Unknown'))
        return invalid_policies

# Usage Example (In PGE loader):
# validator = PolicySchemaValidator('config/governance/PGE_Policy_Structure.json')
# if not validator.validate_policy(my_new_policy): raise SystemHaltError()