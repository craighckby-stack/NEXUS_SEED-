import math
from typing import Dict

class DynamicEfficiencyCalculator:
    """Calculates the runtime dynamic efficiency score based on static configuration and current system utilization data."""

    def __init__(self, static_config: Dict):
        self.static_config = static_config

    def calculate_pce_score(self, class_name: str, current_utilization_ratio: float, effective_tflops: float) -> float:
        """ 
        Calculates Performance/Cost Efficiency (PCE) Score.
        PCE = (Effective Performance * Scaling Factor) / (Base Cost * Utilization Adjustment)
        """
        if class_name not in self.static_config['compute_classes']:
            return 0.0

        cls = self.static_config['compute_classes'][class_name]
        static_efficiency = cls['cost_metrics']['efficiency_score']
        base_cost = cls['cost_metrics']['base_usd_per_second']
        theoretical_flops = cls['performance_metrics']['theoretical_peak_gigaflops'] * 1e9

        # Performance Degradation based on utilization
        performance_multiplier = effective_tflops / (theoretical_flops / 1e12)
        
        # Cost scaling based on utilization (penalize low utilization if fixed cost)
        if cls['scalability_model'] == 'Dedicated_Fixed':
            cost_adjustment_factor = 1.0 / (current_utilization_ratio if current_utilization_ratio > 0.1 else 0.1)
        else:
            cost_adjustment_factor = 1.0

        # Simple weighted calculation for initial scaffolding:
        dynamic_score = static_efficiency * (1.0 + performance_multiplier) / cost_adjustment_factor

        return min(1.0, max(0.0, dynamic_score)) # Normalize between 0 and 1

    def get_most_efficient_class(self, utilization_data: Dict) -> str:
        """Iterates through available classes and returns the dynamically most efficient one."""
        best_score = -1
        best_class = None
        
        for class_name, data in utilization_data.items():
            score = self.calculate_pce_score(
                class_name,
                data.get('utilization_ratio', 0.0),
                data.get('effective_tflops', 0.0)
            )
            if score > best_score:
                best_score = score
                best_class = class_name
                
        return best_class
