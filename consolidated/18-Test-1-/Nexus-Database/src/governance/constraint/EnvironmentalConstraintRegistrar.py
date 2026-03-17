# FILE: src/governance/constraint/EnvironmentalConstraintRegistrar.py

from typing import Dict, Any, Tuple, Union

# ECR: Environmental Constraint Registrar (V2.0)
# Role: Executes Stage 4 resource checks (Pre-MCR Commit Validation).

class EnvironmentalConstraintRegistrar:
    """
    Manages and validates M-02 projected resource utilization against defined ceilings.
    Standardized output ensures easy consumption by the MCRA Engine (S-02).
    """
    
    # Internal Policy Default Weights (Configurable via Policy Engine)
    DEFAULT_LOAD_WEIGHTS = {'cpu': 0.5, 'cost': 0.5}

    def __init__(self, resource_config: Dict[str, Any], cost_ceiling: Union[int, float]):
        self.resource_config = resource_config
        self.cost_ceiling = cost_ceiling
        
        # Extracted configurations
        self.max_cpu = self.resource_config.get('max_cpu_percent', 100.0)
        # Weights should be derived from resource_config if provided, otherwise default
        self.load_weights = self.resource_config.get('load_weights', self.DEFAULT_LOAD_WEIGHTS)

    def _calculate_environmental_load(self, cpu: float, cost: float) -> float:
        """Calculates the weighted environmental load factor based on configured policy, removing magic numbers."""
        w_cpu = self.load_weights.get('cpu', 0.5)
        w_cost = self.load_weights.get('cost', 0.5)
        
        return (cpu * w_cpu) + (cost * w_cost)

    def pre_commit_validation(self, M02_projection: Dict[str, Any]) -> Tuple[bool, Union[Dict[str, Any], str]]:
        """
        Validates M-02 projected utilization against active ceilings.
        Output: (PASS/FAIL boolean, Constraint Metrics Dict (on success) or Failure Message Str (on failure)).
        """
        projected_cpu = M02_projection.get('cpu_load_max', 0.0)
        projected_cost = M02_projection.get('projected_cost_t5', 0.0)
        
        # 1. CPU Constraint Check
        if projected_cpu > self.max_cpu:
            error_msg = (
                f"CPU Constraint Violation: Projected={projected_cpu:.2f}%, Threshold={self.max_cpu:.2f}%. "
                f"Action blocked by Governance L4."
            )
            return False, error_msg
        
        # 2. Cost Constraint Check
        if projected_cost > self.cost_ceiling:
            error_msg = (
                f"Cost Ceiling Breach: Projected=${projected_cost:.2f}, Threshold=${self.cost_ceiling:.2f}. "
                f"Action blocked by Governance L4."
            )
            return False, error_msg

        # Success: Generate structured metric input for S-02/MCRA Engine
        load_factor = self._calculate_environmental_load(projected_cpu, projected_cost)

        metrics = {
            "validation_status": "PASS",
            "environmental_load_factor": load_factor, 
            "projection_cpu_used": projected_cpu,
            "projection_cost_used": projected_cost
        }
        
        return True, metrics

# The ECR output (metrics dictionary) is the critical input for S-02 calculation by the MCRA Engine.