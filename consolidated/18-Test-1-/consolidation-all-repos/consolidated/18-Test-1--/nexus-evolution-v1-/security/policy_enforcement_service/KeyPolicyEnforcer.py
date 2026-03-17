class KeyPolicyEnforcer:
    def __init__(self, policy_config_path):
        # Load and parse policies from aass_key_policies.json
        pass

    def validate_access(self, policy_id, caller_id, required_usage):
        """Validates caller and usage against the defined policy."""
        policy = self._get_policy(policy_id)

        if caller_id not in policy['access_control']['allowed_callers']:
            return False, 'Caller unauthorized'

        # Check if ALL required_usage items are permitted by the policy
        if not all(usage in policy['access_control']['required_usage'] for usage in required_usage):
            return False, 'Requested usage violates policy restrictions'
            
        # Add checks for key status and rotation status

        return True, 'Access granted'

    def _get_policy(self, policy_id):
        # Placeholder implementation for fetching policy data
        pass

