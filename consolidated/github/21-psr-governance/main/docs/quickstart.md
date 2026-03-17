# PSR Governance Quickstart

Get governance for your self-modifying system in **5 minutes**.

---

## 📋 Prerequisites

- Python 3.8 or higher
- pip package manager

```bash
python --version  # Should be 3.8+
pip --version
```

---

## 🚀 Installation

```bash
# Install from PyPI
pip install psr-governance

# Or from source
git clone https://github.com/craighckby-stack/psr-governance.git
cd psr-governance
pip install -e .
```

---

## 🎯 Your First Governed System

### Step 1: Extend FluxNode

```python
from psr_governance import FluxNode

class MyAdaptiveSystem(FluxNode):
    """Your self-modifying system."""
    
    def process_data(self, data):
        """Add your custom logic."""
        # FluxNode provides:
        # - Automatic structure evolution
        # - Automatic strategy adaptation
        # - Complete audit trail
        result = self.interact(data, "processing")
        return result
```

### Step 2: Create a Test

```python
def test_my_system():
    """Test that exercises all evolutionary paths."""
    system = MyAdaptiveSystem("my-test")
    
    # Phase 1: Numeric data
    for i in range(35):
        system.interact(i, "numeric")
    
    # Phase 2: Text data
    for i in range(10):
        system.interact(f"text_{i}", "text")
    
    # Phase 3: High-frequency
    for i in range(10):
        system.interact("ping", "heartbeat")
    
    return system, {
        'interactions': system.metrics.total_interactions
    }
```

### Step 3: Run with Performance Gates

```python
from psr_governance import IntegratedTestRunner

runner = IntegratedTestRunner(mode='baseline')
runner.run_test(test_my_system, "my_test", "evolution_cycle")
runner.print_summary()
```

### Complete Example

Save as `my_governed_system.py`:

```python
from psr_governance import FluxNode, IntegratedTestRunner

class MyAdaptiveSystem(FluxNode):
    def process_data(self, data):
        return self.interact(data, "processing")

def test_my_system():
    system = MyAdaptiveSystem("quick-demo")
    
    for i in range(35):
        system.interact(i, "numeric")
    
    for i in range(10):
        system.interact(f"text_{i}", "text")
    
    for i in range(10):
        system.interact("ping", "heartbeat")
    
    return system, {'interactions': system.metrics.total_interactions}

if __name__ == "__main__":
    runner = IntegratedTestRunner(mode='baseline')
    runner.run_test(test_my_system, "demo", "evolution_cycle")
    runner.print_summary()
```

Run it:

```bash
python my_governed_system.py
```

Output:

```
╔════════════════════════════════════════════════════════════╗
║  INTEGRATED PERFORMANCE REGRESSION FRAMEWORK                    ║
╚════════════════════════════════════════════════════════════╝

======================================================================
EXECUTING: demo
Mode: BASELINE | Budget: evolution_cycle
======================================================================

[✓ PASS] demo (145.32ms)

✓ Baseline saved
```

---

## 🎨 Execution Modes

### Baseline Mode

Establish initial performance benchmarks:

```python
runner = IntegratedTestRunner(mode='baseline')
```

- Records metrics as baseline
- Never fails
- Use for first run

### Validate Mode

Compare against baseline (for PRs):

```python
runner = IntegratedTestRunner(mode='validate')
```

- Compares current vs baseline
- Warns on regressions
- Doesn't block on regressions

### Enforce Mode

Hard-fail on violations (for production):

```python
runner = IntegratedTestRunner(mode='enforce')
```

- Blocks on regressions
- Critical severity fails immediately
- Use for main branch

---

## 📊 Performance Budgets

Predefined budgets from chaos testing:

```python
PERFORMANCE_BUDGETS = {
    'evolution_cycle': {
        'max_latency_ms': 200,     # Must complete in 200ms
        'max_function_calls': 5000   # No more than 5000 calls
    },
    'memory_exhaustion': {
        'max_duration_ms': 5000,
        'max_object_delta': 1_000_000  # No more than 1M objects
    }
}
```

Use existing budgets or define your own:

```python
from psr_governance.regression_framework import PERFORMANCE_BUDGETS

# Add custom budget
PERFORMANCE_BUDGETS['my_custom_test'] = {
    'max_latency_ms': 1000,
    'max_memory_mb': 512
}
```

---

## 🚨 What Happens When Budgets Exceeded?

### Budget Violation Example

```
[✗ FAIL] evolution_cycle (215.43ms)

Budget Violations:
  ❌ duration_ms: 215.43 exceeds max 200
  ❌ function_calls: 5234 exceeds max 5000

✗ Critical failures detected
```

### Regression Example

```
Regression Analysis:
  [⚠️ REGRESSION] duration_ms: 145.32 → 215.43 (📈 48.2%)
    Severity: CRITICAL

✗ Critical failures or regressions detected
```

---

## 🔧 Customizing Thresholds

### Adjusting Evolutionary Triggers

```python
class MySystem(FluxNode):
    # Custom thresholds
    STRUCTURAL_THRESHOLD = 50   # Default: 30
    FUNCTIONAL_THRESHOLD = 10   # Default: 5
    EMERGENT_THRESHOLD = 15     # Default: 8
```

### Adjusting Performance Budgets

```python
# In your test file
runner = IntegratedTestRunner(mode='enforce')

# Override budgets per test
runner.run_test(
    test_func=my_test,
    test_name="my_custom_test",
    budget_name="custom_budget"
)

# Or modify global budgets
from psr_governance.regression_framework import PERFORMANCE_BUDGETS
PERFORMANCE_BUDGETS['evolution_cycle']['max_latency_ms'] = 300
```

---

## 📖 Next Steps

### Learn More

- [Architecture Guide](architecture.md) - Understand PSR principles
- [Chaos Engineering Guide](chaos_guide.md) - Test under extreme conditions
- [Production Deployment](production_deployment.md) - Run in production

### Examples

- [ML Model Governance](../examples/ml_model_governance.py) - Govern ML models
- [Infrastructure Autoscaling](../examples/infrastructure_governance.py) - Govern autoscalers

### Integration

- [CI/CD Integration](../.github/workflows/psr_governance.yml) - GitHub Actions example
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines

---

## ❓ Common Questions

### Q: Can I use this with non-adaptive systems?

**A**: Yes! While designed for self-modifying systems, the performance testing and regression detection work for any system.

### Q: How do I add new chaos scenarios?

**A**: See [Chaos Engineering Guide](chaos_guide.md) for examples.

### Q: Can I run this in production?

**A**: Yes! Use `mode='enforce'` and integrate with your CI/CD pipeline. See [Production Deployment](production_deployment.md).

### Q: What if my system takes longer than 200ms?

**A**: Adjust the budget:
```python
PERFORMANCE_BUDGETS['evolution_cycle']['max_latency_ms'] = 500
```

---

## 🆘 Need Help?

- [GitHub Issues](https://github.com/craighckby-stack/psr-governance/issues)
- [Documentation](https://github.com/craighckby-stack/psr-governance)
- [Examples](../examples/)

---

**Ready to govern your self-modifying systems?** 🛡️

Go back to [README](../README.md) or explore the [architecture](architecture.md).
