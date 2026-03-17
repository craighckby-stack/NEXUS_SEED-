import json
import os
from typing import Dict, Any, List

class TrustPolicyResolver:
    """Resolves the effective, merged trust policy for a given data stream ID.
    
    Optimized for performance by pre-indexing data streams for O(1) lookup.
    """

    def __init__(self, config_path: str = 'config/security/data_trust_endpoints_v1.json'):
        self._load_config(config_path)
        
        self.global_defaults: Dict[str, Any] = self.config.get('global_policy_defaults', {})
        self.policies: Dict[str, Dict[str, Any]] = self.config.get('trust_policies', {})
        
        # Optimization: Pre-index streams for O(1) lookup in resolve_stream_policy
        stream_list: List[Dict[str, Any]] = self.config.get('data_streams', [])
        self._stream_map: Dict[str, Dict[str, Any]] = {
            s['stream_id']: s for s in stream_list
        }
    
    def _load_config(self, config_path: str):
        """Loads and parses the JSON configuration file with robust error handling."""
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Trust policy configuration file not found at: {config_path}")
            
        try:
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to decode JSON from {config_path}: {e}")
        except Exception as e:
            raise IOError(f"An unexpected error occurred loading configuration: {e}")

    def resolve_stream_policy(self, stream_id: str) -> Dict[str, Any]:
        """Finds the stream definition and merges global defaults, referenced policy, and local overrides."""
        
        # O(1) lookup using the pre-indexed map
        stream_definition = self._stream_map.get(stream_id)
        
        if not stream_definition:
            raise ValueError(f"Stream ID {stream_id} not defined.")

        # 1. Start with global defaults
        effective_policy = self.global_defaults.copy()

        # 2. Merge referenced named policy
        policy_id = stream_definition.get('policy_id')
        if policy_id and policy_id in self.policies:
            effective_policy.update(self.policies[policy_id])

        # 3. Apply local overrides
        overrides = stream_definition.get('overrides', {})
        effective_policy.update(overrides)

        return effective_policy

    def check_trust_requirement(self, stream_id: str, incoming_score: float) -> bool:
        """Convenience method to check if minimum trust score is met."""
        policy = self.resolve_stream_policy(stream_id)
        required_score = policy.get('trust_score_threshold', 0.0)
        return incoming_score >= required_score
