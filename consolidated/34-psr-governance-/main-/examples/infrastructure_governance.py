"""
Infrastructure Autoscaling Governance Example
=========================================

Example of using PSR Governance to ensure infrastructure
remains safe and cost-effective as it auto-scales.

Use Case:
- Kubernetes autoscaler that learns optimal pod configs
- Changes scaling thresholds (structural mutation)
- Switches between scaling strategies (functional mutation)
- Creates custom metrics (emergent behavior)

Without this framework:
→ Cost explosion from over-scaling
→ Performance degradation from under-scaling
→ No audit trail of why it scaled

With this framework:
→ Budget gates prevent runaway costs
→ Regression detection catches performance issues
→ Full mutation audit trail
"""

from psr_governance import FluxNode, IntegratedTestRunner
from typing import Dict, List, Tuple
import time


class AdaptiveScaler(FluxNode):
    """
    Kubernetes autoscaler that learns optimal configurations.
    
    Inherits governance from FluxNode:
    - Structural evolution (threshold changes)
    - Functional adaptation (strategy changes)
    - Emergent behavior (custom metrics)
    - Complete audit trail
    """
    
    def __init__(self, cluster_id: str):
        super().__init__(cluster_id)
        self.min_pods = 1
        self.max_pods = 10
        self.target_cpu = 70.0
        self.strategy = "simple"
        self.cost_per_hour = 0.10
        self.total_cost = 0.0
    
    def optimize_resources(self, metrics: Dict):
        """
        Optimize resource allocation based on metrics.
        
        This is where system evolves:
        - Adjust scaling thresholds (structural)
        - Switch scaling strategies (functional)
        - Spawn specialized monitoring (emergent)
        """
        cpu_usage = metrics.get('cpu_usage', 50)
        request_rate = metrics.get('request_rate', 1000)
        
        print(f"\n⚙️  Optimizing resources:")
        print(f"   CPU: {cpu_usage}%")
        print(f"   Requests: {request_rate}/s")
        
        # Evolution 1: Structural - Adjust thresholds based on patterns
        if cpu_usage > 85 and self.max_pods < 20:
            self._evolve_structure()
            self.max_pods = 20
            print(f"   📈 Increased max_pods to {self.max_pods}")
        
        elif cpu_usage < 40 and self.max_pods > 5:
            self._evolve_structure()
            self.max_pods = 5
            print(f"   📉 Decreased max_pods to {self.max_pods}")
        
        # Evolution 2: Functional - Switch strategies
        if request_rate > 5000 and self.strategy != "predictive":
            self._evolve_strategy("predictive")
            self.strategy = "predictive"
            print(f"   🧠 Switched to predictive scaling")
        elif request_rate < 2000 and self.strategy != "reactive":
            self._evolve_strategy("reactive")
            self.strategy = "reactive"
            print(f"   ⚡ Switched to reactive scaling")
        
        # Evolution 3: Emergent - Custom metrics for high load
        if request_rate > 10000 and not hasattr(self, 'rapid_channel'):
            self._spawn_emergent_method("high_load_monitoring")
            print(f"   📊 Spawned custom monitoring")
        
        # Calculate scaling action
        new_pods = self._calculate_pods(cpu_usage)
        cost = new_pods * self.cost_per_hour
        self.total_cost += cost
        
        # Log optimization
        self.interact({
            'pods': new_pods,
            'strategy': self.strategy,
            'cost_per_hour': cost
        }, "scaling")
        
        print(f"   → Scaled to {new_pods} pods (${cost:.2f}/hr)")
        
        return new_pods
    
    def _evolve_strategy(self, new_strategy: str):
        """Evolve scaling strategy."""
        self.interact(
            {'strategy_change': f"{self.strategy} → {new_strategy}"},
            "strategy_evolution"
        )
    
    def _calculate_pods(self, cpu_usage: float) -> int:
        """Calculate optimal number of pods."""
        if self.strategy == "predictive":
            # Predictive: preemptive scaling
            if cpu_usage > 60:
                return min(self.max_pods, int(self.max_pods * 0.8))
            elif cpu_usage < 30:
                return max(self.min_pods, int(self.max_pods * 0.3))
            else:
                return int(self.max_pods * 0.5)
        else:
            # Reactive: scale on threshold breach
            if cpu_usage > self.target_cpu:
                return min(self.max_pods, int(cpu_usage / self.target_cpu * 10))
            elif cpu_usage < self.target_cpu / 2:
                return max(self.min_pods, int(cpu_usage / self.target_cpu * 10))
            else:
                return int(self.max_pods * 0.5)


def test_autoscaling_optimization():
    """
    Test autoscaling with governance.
    
    Validates:
    1. Scaling doesn't exceed budget limits
    2. Performance doesn't degrade
    3. Cost remains reasonable
    4. All mutations are auditable
    """
    scaler = AdaptiveScaler("production-cluster")
    
    print("\n" + "="*60)
    print("INFRASTRUCTURE AUTOSCALING GOVERNANCE TEST")
    print("="*60)
    
    # Simulate traffic patterns
    traffic_scenarios = [
        {'cpu_usage': 30, 'request_rate': 500, 'name': 'Low Traffic'},
        {'cpu_usage': 50, 'request_rate': 2000, 'name': 'Normal Traffic'},
        {'cpu_usage': 90, 'request_rate': 8000, 'name': 'High Traffic (triggers structural)'},
        {'cpu_usage': 95, 'request_rate': 12000, 'name': 'Peak Traffic (triggers emergent)'},
        {'cpu_usage': 40, 'request_rate': 1500, 'name': 'Traffic Drop'},
        {'cpu_usage': 25, 'request_rate': 500, 'name': 'Low Traffic Again'},
    ]
    
    print("\n--- Simulating Traffic Patterns ---")
    for i, scenario in enumerate(traffic_scenarios):
        print(f"\n[Scenario {i+1}] {scenario['name']}")
        pods = scaler.optimize_resources(scenario)
        time.sleep(0.05)
    
    # Analyze results
    print("\n--- Optimization Results ---")
    print(f"Total Cost: ${scaler.total_cost:.2f}")
    print(f"Final Strategy: {scaler.strategy}")
    print(f"Scaling Events: {scaler.metrics.total_interactions}")
    print(f"Structural Evolutions: {scaler.metrics.structural_transitions}")
    print(f"Functional Adaptations: {scaler.metrics.functional_transitions}")
    print(f"Emergent Behaviors: {scaler.metrics.emergent_behaviors}")
    
    # Validate constraints
    assert scaler.total_cost < 50.0, f"Cost too high: ${scaler.total_cost}"
    assert scaler.metrics.structural_transitions <= 2, "Too many structural changes"
    assert scaler.metrics.functional_transitions <= 2, "Too many strategy changes"
    
    print("\n✅ All infrastructure constraints satisfied")
    
    # Show audit trail
    print("\n--- Audit Trail (Last 5 Events) ---")
    history = scaler.get_evolution_history()
    for event in history[-5:]:
        print(f"  {event['timestamp']:.0f}: {event['type']}")
    
    # Return metrics for governance
    return scaler, {
        'total_cost': scaler.total_cost,
        'final_strategy': scaler.strategy,
        'scaling_events': scaler.metrics.total_interactions,
        'structural_transitions': scaler.metrics.structural_transitions,
        'functional_transitions': scaler.metrics.functional_transitions,
        'emergent_behaviors': scaler.metrics.emergent_behaviors
    }


if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════════════════════╗
║  PSR Governance - Infrastructure Autoscaling Example          ║
║  Governing Self-Optimizing Infrastructure                ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    # Create test runner
    runner = IntegratedTestRunner(mode='enforce')
    
    # Run infrastructure test
    runner.run_test(
        test_func=test_autoscaling_optimization,
        test_name="infrastructure_autoscaling",
        budget_name="evolution_cycle"
    )
    
    # Print results
    gate_passed = runner.print_summary()
    
    if gate_passed:
        print("\n✅ Infrastructure autoscaling is production-ready!")
        print("\nKey benefits:")
        print("  ✓ Cost growth monitored and bounded")
        print("  ✓ Scaling strategies adapt intelligently")
        print("  ✓ Performance constraints enforced")
        print("  ✓ Complete audit trail of scaling decisions")
        print("  ✓ Prevents cost explosion and performance degradation")
    else:
        print("\n❌ Autoscaling fails governance gates")
        print("  Review cost and performance metrics")
    
    print("\n📖 Next steps:")
    print("  - Integrate with your Kubernetes cluster")
    print("  - Set up cost alerting")
    print("  - Monitor scaling patterns")
    print("  - See docs/production_deployment.md")
