# governance/AICV_PolicyEnforcementModule.py
import yaml
from typing import Dict, Any

class AICV_PolicyEnforcementModule:
    """
    Handles dynamic loading, validation, and provision of cryptographic standards 
    and parameters defined in AICV_Security_Policy.yaml. 
    (Serving as the SPE Layer described in the protocol spec.)
    """
    
    def __init__(self, policy_path: str = 'AICV_Security_Policy.yaml'):
        self.policy_path = policy_path
        self._policy_data = self._load_policy()
        self._validate_policy()

    def _load_policy(self) -> Dict[str, Any]:
        """Loads and parses the policy file."""
        try:
            # In a secure environment, this would involve encrypted loading
            with open(self.policy_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            raise RuntimeError(f"Required policy file not found: {self.policy_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML format in policy file: {e}")

    def _validate_policy(self):
        """Ensures mandatory primitives and standards are defined."""
        required_fields = ['hash_primitive', 'key_standard', 'max_lock_age_seconds']
        if not all(field in self._policy_data for field in required_fields):
            raise ValueError(f"Policy missing mandatory fields: {required_fields}")

        # Example integrity checks based on current governance standards
        if self._policy_data['hash_primitive'] not in ['SHA3-512', 'BLAKE2b']:
             raise ValueError("Unsupported hash_primitive specified in policy. Must be high-entropy standard.")
             
    def get_operational_context(self) -> Dict[str, Any]:
        """
        Returns the validated security context (H_POL, key standard, SPE_Nonce) 
        required by the AICVD for a validation cycle.
        """
        # Generate a unique policy nonce tied to the current policy revision (for CPH computation)
        policy_revision_hash = hash(frozenset(self._policy_data.items()))
        
        return {
            'H_POL': self._policy_data['hash_primitive'],
            'Key_Standard': self._policy_data['key_standard'],
            'SPE_Nonce': hex(policy_revision_hash)
        }