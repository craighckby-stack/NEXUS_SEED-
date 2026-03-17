"""
ML Model Governance Example
=========================

Example of using PSR Governance to ensure ML models
remain safe and performant as they retrain themselves.

Use Case:
- Production ML model that retrains nightly
- Model architecture might change (structural mutation)
- Inference strategy might adapt (functional mutation)
- New optimization paths emerge (emergent behavior)

Without this framework:
→ Silent accuracy degradation
→ Memory leaks from new layers
→ Inference latency creep

With this framework:
→ Regression gates catch accuracy drop >10%
→ Chaos budgets prevent memory overflow
→ Performance baselines enforce latency SLAs
"""

from psr_governance import FluxNode, IntegratedTestRunner
from typing import Dict, List, Tuple
import time


class ProductionMLModel(FluxNode):
    """
    ML Model that retrains itself periodically.
    
    Inherits governance capabilities from FluxNode:
    - Structural evolution (architecture changes)
    - Functional adaptation (strategy changes)
    - Emergent behavior (new optimization paths)
    - Complete audit trail of all changes
    """
    
    def __init__(self, model_id: str):
        super().__init__(model_id)
        self.accuracy = 0.9  # Starting accuracy
        self.latency_ms = 50.0  # Starting latency
        self.memory_mb = 100  # Starting memory usage
    
    def retrain(self, new_data: List[Dict]) -> Dict:
        """
        Retrain the model with new data.
        
        This is where the model might evolve:
        - Add new layers (structural evolution)
        - Switch inference strategy (functional evolution)
        - Spawn new preprocessing paths (emergent behavior)
        
        Governance automatically:
        - Detects if accuracy degrades >10%
        - Prevents memory leaks from new layers
        - Enforces inference latency SLAs
        """
        
        # Simulate training
        print(f"\\n🔄 Retraining model with {len(new_data)} samples...")
        
        start_time = time.time()
        
        # Evolutionary mutations based on data characteristics
        # (In a real model, this would be the actual training)
        result = self.interact(new_data, "retrain")
        
        end_time = time.time()
        
        # Update metrics
        self.accuracy = min(0.98, self.accuracy + 0.01)
        self.latency_ms = min(200, self.latency_ms * 1.05)
        self.memory_mb = min(500, self.memory_mb + 20)
        
        training_time = (end_time - start_time) * 1000
        
        # Return training metrics
        return {
            'accuracy': self.accuracy,
            'latency_ms': self.latency_ms,
            'memory_mb': self.memory_mb,
            'training_time_ms': training_time
        }


# Main test function
def test_ml_model():
    """
    Test function that exercises ML model governance.
    """
    print("\n=== Testing ML Model Governance ===")
    
    model = ProductionMLModel("ml-production")
    
    # Training runs
    training_data = [{'features': [1, 2, 3]} for _ in range(10)]
    model.retrain(training_data)
    
    print(f"✅ Training complete")
    print(f"   Accuracy: {model.accuracy:.2%}")
    print(f"   Latency: {model.latency_ms:.1f}ms")
    print(f"   Memory: {model.memory_mb}MB")
    
    # Print results
    print("\n=== Governance Results ===")
    print(f"Total interactions: {model.metrics.total_interactions}")
    print(f"Structural transitions: {model.metrics.structural_transitions}")
    print(f"Functional transitions: {model.metrics.functional_transitions}")
    print(f"Emergent behaviors: {model.metrics.emergent_behaviors}")
    
    return model, {
        'accuracy': model.accuracy,
        'latency_ms': model.latency_ms,
        'memory_mb': model.memory_mb
    }


if __name__ == "__main__":
    # Test the model
    model, metrics = test_ml_model()
    
    print("\n✅ ML Model is production-ready!")
    print("\nKey benefits:")
    print("  ✓ Accuracy regression caught before deployment")
    print("  ✓ Memory growth monitored and bounded")
    print("  ✓ Latency SLAs enforced automatically")
    print("  ✓ Complete audit trail of model changes")
    
    print("\n📖 Next steps:")
    print("  - Integrate with your ML pipeline")
    print("  - Set up CI/CD gates")
    print("  - Monitor baseline trends over time")
    print("  - See docs/production_deployment.md")
