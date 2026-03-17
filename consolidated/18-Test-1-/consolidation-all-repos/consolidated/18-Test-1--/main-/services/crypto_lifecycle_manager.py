import json
from datetime import datetime, timedelta

class CryptoLifecycleManager:
    """
    Core service responsible for enforcing the key policies defined in 
    security/aass_crypto_lifecycle.json. It tracks asset states, triggers rotation,
    and handles transition logic based on scheduled checks or external events.
    """
    def __init__(self, config_path="security/aass_crypto_lifecycle.json"):
        try:
            with open(config_path, 'r') as f:
                self.config = json.load(f)
            self.state_machine = self.config['lifecycle_state_machine']
            self.policies = self.config['policies']
            # NOTE: Integration point needed for ISO 8601 duration parsing utility
        except FileNotFoundError:
            raise RuntimeError(f"Configuration file not found at {config_path}")

    def get_valid_transitions(self, current_state: str) -> list:
        """Retrieves transitions valid from the current state."""
        valid = []
        for transition in self.state_machine['transitions']:
            if current_state in transition['from']:
                valid.append(transition['name'])
        return valid

    def transition_state(self, asset_id: str, policy_id: str, new_transition: str, trigger_info: dict):
        """Executes the state transition for a cryptographic asset.

        1. Validates the transition.
        2. Interacts with the underlying KMS/HSM.
        3. Logs mandatory audit trail entry.
        """
        # Placeholder for actual operational logic
        current_state = 'ACTIVE' # Assume current state retrieval

        if new_transition not in self.get_valid_transitions(current_state):
            print(f"[ERROR] Invalid transition '{new_transition}' requested from state '{current_state}'")
            return False

        print(f"[INFO] Asset {asset_id} transitioning via '{new_transition}'...")

        # Implement KMS/HSM API call here (e.g., disable_key, schedule_key_deletion)
        # Audit Logging implementation required
        
        return True

# NOTE: This manager requires an independent scheduler component to periodically call
# check_for_rotation and enforce time-based transitions (like P180D rotation or P90D purge).
