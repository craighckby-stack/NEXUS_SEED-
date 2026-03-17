import yaml
import os
from typing import Dict, Any, Optional

# Define the expected constraints structure (mirroring ArtifactDependencyAuditor)
GOVERNANCE_CONFIG_SCHEMA = {
    "cpu_max_msec": int,
    "memory_peak_mb": int,
    "io_latency_max_ms": int,
    "max_dependency_depth": int
}

class ConfigurationGateway:
    """
    Centralized component for dynamically loading and validating governance policies
    and resource constraints from external sources (e.g., YAML configuration files).
    Ensures auditability of policy source.
    """
    
    DEFAULT_POLICY_PATH = "config/governance/constraints_v94.yaml"

    def __init__(self, policy_path: str = DEFAULT_POLICY_PATH):
        self.policy_path = policy_path
        self.config: Optional[Dict] = None

    def load_policies(self) -> Dict[str, Any]:
        """Loads and caches the configuration policies."""
        if self.config:
            return self.config
        
        try:
            if not os.path.exists(self.policy_path):
                 raise FileNotFoundError(f"Policy file not found at {self.policy_path}")

            # Using YAML due to its widespread adoption in policy definition
            with open(self.policy_path, 'r') as f:
                raw_config = yaml.safe_load(f)
            
            self._validate_config_schema(raw_config.get("resource_constraints", {}))
            self.config = raw_config
            return self.config

        except Exception as e:
            print(f"CRITICAL CONFIG ERROR: Failed to load governance policies from {self.policy_path}: {e}")
            # Return safe defaults if policy loading fails, to allow system bootstrap
            return {"resource_constraints": self._get_hardcoded_defaults()}

    def get_resource_constraints(self) -> Dict[str, int]:
        """Extracts validated resource constraints."""
        if self.config is None:
            # Attempt to load policies if not cached
            self.load_policies()
        
        return self.config.get("resource_constraints", self._get_hardcoded_defaults())

    def _validate_config_schema(self, constraints: Dict):
        """Ensures the loaded constraints adhere to the mandatory V94 schema."""
        for key, expected_type in GOVERNANCE_CONFIG_SCHEMA.items():
            if key not in constraints:
                raise ValueError(f"Missing mandatory governance constraint: {key}")
            if not isinstance(constraints[key], expected_type):
                raise TypeError(f"Constraint {key} must be type {expected_type.__name__}")
        
    def _get_hardcoded_defaults(self): 
        """Provides emergency default constraints if external loading fails."""
        return {
            "cpu_max_msec": 5000,
            "memory_peak_mb": 1024,
            "io_latency_max_ms": 50,
            "max_dependency_depth": 3
        }