import json
from typing import Dict, Any

class TQM_PolicyDispatcher:
    def __init__(self, policy_config_path: str):
        self.config = self._load_config(policy_config_path)
        self.gates = self.config.get("quality_gates", {})

    def _load_config(self, path: str) -> Dict[str, Any]:
        with open(path, 'r') as f:
            return json.load(f)

    def evaluate_metric(self, metric_key: str, value: float, context: Dict[str, Any]):
        violations = []
        
        # Iterate through all gates and policies
        for gate_name, gate_data in self.gates.items():
            for policy in gate_data.get('policies', []):
                if policy['metric_key'] == metric_key:
                    violation = self._check_violation(policy, value)
                    if violation:
                        violations.append({
                            "policy_id": policy['id'],
                            "severity": policy['severity'],
                            "handler": policy['enforcement_handler'],
                            "auto_fixable": policy['auto_fixable'],
                            "details": violation
                        })
        
        return violations

    def _check_violation(self, policy: Dict[str, Any], value: float) -> str or None:
        threshold = policy['threshold']
        mode = policy['mode']
        
        if mode == 'MAX_VIOLATION' and value > threshold:
            return f"Value {value} exceeds max threshold {threshold}."
        if mode == 'MIN_REQUIREMENT' and value < threshold:
            return f"Value {value} is below minimum requirement {threshold}."
        
        # Add other modes (e.g., RANGE_VIOLATION)
        
        return None

    def dispatch_violations(self, violations: list):
        # Logic to route violation data to the specified handler (e.g., EvolutionEngine, ArchitectureReviewer)
        for violation in violations:
            handler = violation['handler']
            # Example: A mechanism to invoke handler dynamically
            print(f"Dispatching {violation['severity']} violation to handler: {handler}")
            # Execute: GovernanceKernel.invoke_module(handler, violation)

# Note: Execution logic for specific handlers must be handled by the primary AGI kernel.