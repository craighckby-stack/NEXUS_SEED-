import json
from typing import Dict, Any, List

class GSEPImpactPropagator:
    """Calculates the projected impact score of proposed code changes using the GSEP dependency graph."""

    def __init__(self, dependency_matrix: Dict[str, Any]):
        self.matrix = dependency_matrix
        self.modules = {m['id']: m for m in self.matrix['module_definitions']}
        self.edges = self.matrix['dependency_graph']['edges']

    def calculate_evolution_risk(self, target_module_id: str, proposed_stability_delta: float) -> float:
        """Calculates a composite risk score for changes to a target module.
        Risk is weighted by coupled criticality and edge severity.
        """
        if target_module_id not in self.modules:
            return 1.0 # Max Risk

        base_crit = self.modules[target_module_id]['evolution_state']['criticality_index']
        risk_accumulator = 0.0

        # Analyze dependencies where the target module is the SOURCE (direct impact propagation)
        for edge in self.edges:
            if edge['source'] == target_module_id:
                target_crit = self.modules[edge['target']]['evolution_state']['criticality_index']
                impact_severity = edge['evolution_constraints']['impact_severity_index']
                
                # Risk = (Source Criticality * Target Criticality * Severity * (1 - New Stability))
                edge_risk = base_crit * target_crit * impact_severity * abs(proposed_stability_delta)
                risk_accumulator += edge_risk
        
        return min(risk_accumulator, 1.0)

if __name__ == '__main__':
    # Example instantiation (Placeholder)
    matrix_data = { ... self.content structure ... }
    # propagator = GSEPImpactPropagator(matrix_data)
    # risk = propagator.calculate_evolution_risk("Core.InferenceEngine", -0.1) # Simulate 10% stability loss
    # print(f"Calculated Risk: {risk}")
