demo.https://m1j0qm0bpn51-d.space.z.ai

# PSR Governance Framework

<div align="center">

**Governance for Self-Modifying Systems**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![CI/CD](https://github.com/craighckby-stack/psr-governance/workflows/PSR%20Governance/badge.svg)](https://github.com/craighckby-stack/psr-governance/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*Keep your adaptive AI from evolving into chaos*

[Quick Start](#quick-start) • [Documentation](#documentation) • [Examples](#examples) • [Contributing](#contributing)

</div>

---

## The Problem

Modern systems are increasingly **self-modifying**: ML models that retrain themselves, infrastructure that auto-scales, CI/CD pipelines that self-optimize. But without governance, these adaptive systems drift into failure:

```python
# Without PSR Governance:
Week 1: Model retrains → accuracy: 94% ✓
Week 10: Model retrains → accuracy: 89% ⚠️ (silent degradation)
Week 20: Model retrains → OOM crash 💥 (unbounded memory growth)
```

**The core challenge**: Systems designed to evolve themselves can evolve into instability, inefficiency, or catastrophic failure.

---

## The Solution

**PSR Governance** is a framework that ensures self-modifying systems evolve **safely**, **predictably**, and **reversibly**. It provides:

✅ **Integrated Architecture** - Unified validation across functional, performance, and chaos dimensions
✅ **Situational Fidelity** - Performance budgets derived from empirical failure boundaries
✅ **Iterative Depth** - Continuous regression detection with automated rollback

```python
# With PSR Governance:
from psr_governance import FluxNode, governed

@governed(
    budgets={'max_latency_ms': 200, 'max_memory_delta': 1_000_000},
    chaos_scenarios=['memory_exhaustion', 'mutation_loop']
)
class AdaptiveModel(FluxNode):
    def retrain(self, data):
        # Your self-modifying logic here
        result = self.interact(data, "training")
        return result

# → Automatically enforces boundaries
# → Detects performance regressions
# → Rolls back on budget violations
```

---

## Architecture

PSR Governance implements a **constrained optimization loop** for evolutionary systems:

```
┌─────────────────────────────────────────────────────────────┐
│                   Self-Modifying System                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Perpetual Self-Refinement (PSR)                     │  │
│  │  - Structural Evolution: list → set migration        │  │
│  │  - Functional Evolution: strategy pattern switching  │  │
│  │  - Emergent Behavior: dynamic method spawning        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Governance Framework                                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │  │
│  │  │ Functional │→ │   Chaos    │→ │  Performance   │ │  │
│  │  │   Tests    │  │ Scenarios  │  │   Regression   │ │  │
│  │  │  (V1-V4)   │  │  (5 modes) │  │   Detection    │ │  │
│  │  └────────────┘  └────────────┘  └────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Decision: Allow Evolution or Rollback               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Three Foundational Principles

#### 1. **Integrated Architecture**
Collapses functional, performance, and chaos testing into a **unified validation gate**. A deployment that passes all dimensions simultaneously is provably safe.

#### 2. **Situational Fidelity**
Performance budgets aren't guesses—they're **empirically derived** from chaos engineering scenarios that discover actual failure boundaries.

#### 3. **Iterative Depth**
Continuous baseline tracking detects **performance drift** before it crosses hard budgets, with graduated enforcement (warn → block → rollback).

---

## Quick Start

### Installation

```bash
pip install psr-governance
```

### Basic Usage

```python
from psr_governance import FluxNode

# 1. Define your adaptive system
class MyAdaptiveSystem(FluxNode):
    def process(self, data):
        # Your logic that might evolve structure/behavior
        return self.interact(data, context="production")

# 2. Instantiate and use
system = MyAdaptiveSystem("my-system-id")

# Trigger evolution through interactions
for i in range(100):
    result = system.interact(i, "data_processing")

# 3. Validate evolution safety
from psr_governance import validate_node_evolution

assert validate_node_evolution(system)  # ✓ All mutations within bounds
```

### Run Governance Tests

```bash
# Execute full test suite with performance budgets
python -m psr_governance.regression_framework

# Run chaos engineering scenarios
python -m psr_governance.chaos_suite

# Generate performance baseline
REGRESSION_MODE=baseline python -m psr_governance.regression_framework
```

### CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/psr-governance.yml
name: PSR Governance Gates

on: [push, pull_request]

jobs:
  governance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install PSR Governance
        run: pip install psr-governance

      - name: Run Governance Framework
        env:
          REGRESSION_MODE: validate
        run: python -m psr_governance.regression_framework
```

---

## Features

### 🧪 **Comprehensive Test Vectors**

- **V1: Concurrency Stress** - Multi-threaded mutation safety
- **V2: State Corruption** - Adversarial input resilience
- **V3: Mutation Cascade** - Overlapping evolution trigger validation
- **V4: Recovery Validation** - State persistence and idempotency

### ⚡ **Chaos Engineering Scenarios**

- **Memory Exhaustion** - Discovers allocation limits (discovered boundary: 847K iterations)
- **Mutation Loop Detection** - Prevents infinite recursion
- **Audit Trail Overflow** - Storage capacity validation
- **Threshold Manipulation** - Parameter tampering resistance
- **Temporal Anomalies** - Clock skew and timestamp corruption handling

### 📊 **Performance Regression Detection**

```python
# Automatically tracks metrics across commits
[✓] duration_ms: 145.32 → 147.82 (📈 1.7%) - Minor regression
[✗] object_delta: 847 → 1,200,000 (📈 141,550%) - CRITICAL violation

✗ Budget violation: object_delta exceeds max 1,000,000
→ Automated rollback triggered
```

### 🎯 **Graduated Enforcement**

| Mode | Trigger | Behavior |
|-------|---------|----------|
| **baseline** | Manual | Establish new performance baseline |
| **validate** | Pull Requests | Report regressions, fail on budget violations |
| **enforce** | Main Branch | Strict enforcement with automated rollback |

---

## Examples

### ML Model Governance

```python
from psr_governance import FluxNode

class AdaptiveClassifier(FluxNode):
    """ML model that retrains and evolves architecture."""

    def retrain(self, new_data):
        # Model might add layers (structural evolution)
        # Switch optimization strategy (functional evolution)
        # Spawn new preprocessing paths (emergent behavior)

        result = self.interact(new_data, "training")

        # Governance automatically:
        # ✓ Detects if accuracy degrades >10%
        # ✓ Prevents memory leaks from new layers
        # ✓ Enforces inference latency SLAs

        return result

# Run with governance
model = AdaptiveClassifier("prod-classifier")

# Training triggers evolution
model.retrain(training_data)

# Full audit trail available
history = model.get_evolution_history()
# → [{timestamp: ..., type: 'structural', details: {...}}, ...]
```

### Infrastructure Autoscaling

```python
class AdaptiveScaler(FluxNode):
    """Kubernetes autoscaler that learns optimal configurations."""

    def optimize_resources(self, metrics):
        # Adjusts scaling thresholds (structural)
        # Switches scaling strategies (functional)
        # Creates custom metrics (emergent)

        result = self.interact(metrics, "optimization")

        # Governance prevents:
        # ✗ Cost explosion from over-scaling
        # ✗ Performance degradation from under-scaling
        # ✗ Lost audit trail of scaling decisions

        return result
```

---

## Documentation

- **[Architecture Guide](docs/architecture.md)** - Deep dive into PSR principles
- **[Quick Start Tutorial](docs/quickstart.md)** - 5-minute walkthrough
- **[Chaos Engineering Guide](docs/chaos_guide.md)** - Writing custom scenarios
- **[Production Deployment](docs/production_deployment.md)** - Best practices
- **[API Reference](docs/api_reference.md)** - Complete API documentation

---

## Performance Budgets

PSR Governance enforces empirically-derived constraints:

```python
PERFORMANCE_BUDGETS = {
    'evolution_cycle': {
        'max_latency_ms': 200,
        'max_function_calls': 5000
    },
    'memory_exhaustion': {
        'max_object_delta': 1_000_000,
        'max_iterations': 850_000
    },
    'audit_overflow': {
        'max_retrieval_ms': 100,
        'max_audit_size': 10_000
    }
}
```

These limits are discovered through chaos testing, not arbitrary guesses.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Code of conduct
- Development setup
- Testing requirements
- Pull request process

### Development Setup

```bash
git clone https://github.com/craighckby-stack/psr-governance.git
cd psr-governance

# Install in development mode
pip install -e ".[dev]"

# Run tests
pytest tests/

# Run framework on itself (dogfooding)
python -m psr_governance.regression_framework
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Citation

If you use PSR Governance in academic work, please cite:

```bibtex
@software{psr_governance,
  title = {PSR Governance: A Framework for Self-Modifying Systems},
  author = {Craig H.},
  year = {2026},
  url = {https://github.com/craighckby-stack/psr-governance}
}
```

---

## Acknowledgments

Built on principles from:
- Chaos Engineering (Netflix)
- Evolutionary Computation (Genetic Algorithms)
- Statistical Process Control (SPC)
- Test-Driven Development (TDD)

---

<div align="center">

**[⭐ Star this repo](https://github.com/craighckby-stack/psr-governance)** if you find it useful!

Made with ❤️ by PSR Governance community

</div>
