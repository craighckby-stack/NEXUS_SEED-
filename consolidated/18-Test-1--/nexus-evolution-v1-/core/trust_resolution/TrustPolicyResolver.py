import json
import os

class TrustPolicyResolver:
    """Resolves the effective, merged trust policy for a given data stream ID."""

    def __init__(self, config_path: str = 'config/security/data_trust_endpoints_v1.json'):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.global_defaults = self.config.get('global_policy_defaults', {})
        self.policies = self.config.get('trust_policies', {})
        self.streams = self.config.get('data_streams', [])
        
    def resolve_stream_policy(self, stream_id: str) -> dict:
        """Finds the stream definition and merges global defaults, referenced policy, and local overrides."""
        stream_definition = next((s for s in self.streams if s['stream_id'] == stream_id), None)
        
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
