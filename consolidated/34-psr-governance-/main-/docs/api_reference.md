# PSR Governance - API Reference

Complete API documentation for the PSR Governance Framework.

---

## Table of Contents

- [Core Classes](#core-classes)
  - [FluxNode](#fluxnode)
  - [PerformanceGate](#performancegate)
  - [IntegratedTestRunner](#integratedtestrunner)
  - [PerformanceBaseline](#performancebaseline)
- [Data Classes](#data-classes)
  - [PerformanceMetrics](#performancemetrics)
  - [NodeMetrics](#nodemetrics)
- [Constants](#constants)
- [Functions](#functions)
- [Modules](#modules)

---

## Core Classes

### FluxNode

Base class for self-modifying systems with governance capabilities.

```python
class FluxNode:
    """Governed self-modifying system with automatic evolution."""

    def __init__(self, node_id: str):
        """
        Initialize a new FluxNode.

        Args:
            node_id: Unique identifier for this node

        Attributes:
            STRUCTURAL_THRESHOLD: Interactions to trigger structural evolution (default: 30)
            FUNCTIONAL_THRESHOLD: Interactions to trigger functional evolution (default: 5)
            EMERGENT_THRESHOLD: Interactions to trigger emergent behavior (default: 8)
        """
```

#### Methods

##### `interact(data, context)`

Process data through the governed system with potential evolution.

```python
def interact(self, data: Any, context: str) -> Dict[str, Any]:
    """
    Process data with automatic evolution detection.

    Args:
        data: Input data to process
        context: Interaction context string

    Returns:
        Dict with:
            - 'result': Processing result
            - 'mutations_triggered': List of mutation types triggered
            - 'evolution_index': Current evolution count

    Evolution triggers:
        - Structural: At STRUCTURAL_THRESHOLD interactions (list → set)
        - Functional: At FUNCTIONAL_THRESHOLD same-type interactions
        - Emergent: At EMERGENT_THRESHOLD same-context interactions
    """
```

**Example**:

```python
node = FluxNode("my-node")

# Process data
result = node.interact(42, "numeric")
# → {'result': True, 'mutations_triggered': [], 'evolution_index': 0}

# Trigger structural evolution (after 30 numeric interactions)
for i in range(30):
    node.interact(i, "numeric")

result = node.interact(31, "numeric")
# → {'result': True, 'mutations_triggered': ['structural'], 'evolution_index': 1}
```

---

##### `get_state_snapshot()`

Get current system state snapshot.

```python
def get_state_snapshot(self) -> Dict[str, Any]:
    """
    Capture complete system state.

    Returns:
        Dict with:
            - 'node_id': Node identifier
            - 'store_type': Current storage type ('list' or 'set')
            - 'store_size': Number of items in data store
            - 'context_count': Number of unique contexts
            - 'metrics': Dict of all metrics
    """
```

**Example**:

```python
snapshot = node.get_state_snapshot()
# {
#     'node_id': 'my-node',
#     'store_type': 'set',
#     'store_size': 30,
#     'context_count': 1,
#     'metrics': {...}
# }
```

---

##### `get_evolution_history()`

Get complete audit trail of all mutations.

```python
def get_evolution_history(self) -> List[Dict[str, Any]]:
    """
    Get audit trail of all evolutionary changes.

    Returns:
        List of dicts with:
            - 'timestamp': Unix timestamp of mutation
            - 'type': Mutation type ('structural', 'functional', 'emergent')
            - 'details': Mutation-specific details
    """
```

**Example**:

```python
history = node.get_evolution_history()
# [
#     {'timestamp': 1705771200.0, 'type': 'structural', 'details': {...}},
#     {'timestamp': 1705771201.0, 'type': 'functional', 'details': {...}}
# ]
```

---

##### `_evolve_structure()`

Trigger structural evolution (protected method).

```python
def _evolve_structure(self) -> None:
    """
    Execute structural mutation: list → set migration.

    Logs evolution and increments metrics.
    Override to customize structural evolution logic.
    """
```

---

##### `_evolve_strategy(sample_data)`

Trigger functional evolution (protected method).

```python
def _evolve_strategy(self, sample_data: Any) -> None:
    """
    Execute functional mutation: strategy pattern switching.

    Args:
        sample_data: Data sample to trigger strategy adaptation

    Logs evolution and increments metrics.
    Override to customize functional evolution logic.
    """
```

---

##### `_spawn_emergent_method(context)`

Trigger emergent behavior (protected method).

```python
def _spawn_emergent_method(self, context: str) -> None:
    """
    Execute emergent mutation: dynamic method spawning.

    Args:
        context: Context that triggered emergent behavior

    Logs evolution and creates new method on instance.
    Override to customize emergent behavior logic.
    """
```

---

#### Properties

##### `metrics`

Access node metrics.

```python
@property
def metrics(self) -> NodeMetrics:
    """
    Get current node metrics.

    Returns:
        NodeMetrics object with:
            - total_interactions: Total number of interact() calls
            - structural_transitions: Number of structural evolutions
            - functional_transitions: Number of functional evolutions
            - emergent_behaviors: Number of emergent behaviors
    """
```

**Example**:

```python
metrics = node.metrics
print(f"Interactions: {metrics.total_interactions}")
print(f"Structural: {metrics.structural_transitions}")
print(f"Functional: {metrics.functional_transitions}")
print(f"Emergent: {metrics.emergent_behaviors}")
```

---

### PerformanceGate

Performance validation gate with profiling and budget enforcement.

```python
class PerformanceGate:
    """Performance validation gate with configurable thresholds."""

    def __init__(
        self,
        max_latency_ms: float = 200,
        max_function_calls: int = 5000,
        verbose: bool = True
    ):
        """
        Initialize performance gate.

        Args:
            max_latency_ms: Maximum allowed execution time in milliseconds
            max_function_calls: Maximum allowed function calls
            verbose: Enable detailed output
        """
```

---

#### Methods

##### `evaluate(test_func)`

Evaluate test function against performance budgets.

```python
def evaluate(self, test_func: Callable) -> bool:
    """
    Execute test function with performance profiling.

    Args:
        test_func: Callable function to profile

    Returns:
        bool: True if all budgets satisfied, False otherwise

    Measures:
        - Total execution time
        - Total function calls
        - Top 10 functions by execution time

    Enforces:
        - max_latency_ms
        - max_function_calls
    """
```

**Example**:

```python
gate = PerformanceGate(max_latency_ms=200, max_function_calls=5000)

def my_test():
    return sum(range(1000))

passed = gate.evaluate(my_test)
# → True (if within budgets)
# → False (if budgets exceeded)
```

---

##### `print_report()`

Print detailed performance report.

```python
def print_report(self) -> None:
    """
    Print performance analysis report.

    Includes:
        - Execution time
        - Function call count
        - Budget violations (if any)
        - Top 10 functions by execution time
    """
```

---

##### `metrics`

Access performance metrics.

```python
@property
def metrics(self) -> Optional[PerformanceMetrics]:
    """
    Get captured performance metrics.

    Returns:
        PerformanceMetrics object or None if evaluate() not called
    """
```

---

### IntegratedTestRunner

Integrated test runner with baseline management and regression detection.

```python
class IntegratedTestRunner:
    """
    Integrated test runner with performance regression detection.

    Modes:
        - baseline: Establish new performance baseline
        - validate: Compare against baseline, warn on regressions
        - enforce: Fail on regressions and budget violations
    """

    def __init__(
        self,
        mode: str = 'baseline',
        baseline_dir: str = './baselines',
        verbose: bool = True
    ):
        """
        Initialize test runner.

        Args:
            mode: Execution mode ('baseline', 'validate', or 'enforce')
            baseline_dir: Directory for storing/loading baselines
            verbose: Enable detailed output
        """
```

---

#### Methods

##### `run_test(test_func, test_name, budget_name)`

Run a test with governance checks.

```python
def run_test(
    self,
    test_func: Callable,
    test_name: str,
    budget_name: str
) -> bool:
    """
    Run test with performance governance.

    Args:
        test_func: Test function that returns (system, metrics)
        test_name: Unique identifier for this test
        budget_name: Name of PERFORMANCE_BUDGETS entry to use

    Returns:
        bool: True if test passed, False otherwise

    Test function signature:
        def test_func():
            system = FluxNode('test')
            # ... test logic ...
            return system, {'custom_metric': value}
    """
```

**Example**:

```python
runner = IntegratedTestRunner(mode='validate')

def my_test():
    system = FluxNode('test')
    for i in range(50):
        system.interact(i, 'numeric')
    return system, {'count': 50}

passed = runner.run_test(my_test, 'my_test', 'evolution_cycle')
```

---

##### `print_summary()`

Print test execution summary.

```python
def print_summary(self) -> bool:
    """
    Print summary of all executed tests.

    Returns:
        bool: True if all tests passed, False otherwise
    """
```

---

### PerformanceBaseline

Performance baseline storage and comparison.

```python
class PerformanceBaseline:
    """Manage performance baselines for regression detection."""

    def __init__(self, baseline_dir: str = './baselines'):
        """
        Initialize baseline storage.

        Args:
            baseline_dir: Directory for storing baseline files
        """
```

---

#### Methods

##### `save(test_name, metrics)`

Save performance metrics as baseline.

```python
def save(self, test_name: str, metrics: Dict[str, Any]) -> None:
    """
    Save metrics as baseline for future comparison.

    Args:
        test_name: Unique test identifier
        metrics: Dict of performance metrics
    """
```

---

##### `load(test_name)`

Load saved baseline metrics.

```python
def load(self, test_name: str) -> Optional[Dict[str, Any]]:
    """
    Load baseline metrics for comparison.

    Args:
        test_name: Unique test identifier

    Returns:
        Dict of baseline metrics or None if not found
    """
```

---

##### `compare(test_name, current_metrics)`

Compare current metrics against baseline.

```python
def compare(
    self,
    test_name: str,
    current_metrics: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compare current metrics against baseline.

    Args:
        test_name: Unique test identifier
        current_metrics: Current test metrics

    Returns:
        Dict with:
            - 'regressions': List of detected regressions
            - 'improvements': List of detected improvements
            - 'unchanged': List of unchanged metrics
            - 'baseline': Baseline metrics used for comparison
    """
```

---

## Data Classes

### PerformanceMetrics

Performance measurement results.

```python
@dataclass
class PerformanceMetrics:
    """Performance metrics captured during gate evaluation."""

    total_time_ms: float
    total_calls: int
    latency_violation: bool
    call_limit_violation: bool
    top_functions: List[Tuple[str, int, int]]

    def __init__(
        self,
        total_time_ms: float,
        total_calls: int,
        latency_violation: bool = False,
        call_limit_violation: bool = False,
        top_functions: List = None
    ):
        """
        Initialize performance metrics.

        Args:
            total_time_ms: Total execution time in milliseconds
            total_calls: Total number of function calls
            latency_violation: Whether latency budget was violated
            call_limit_violation: Whether call count budget was violated
            top_functions: List of (function, calls, time) tuples
        """
```

---

### NodeMetrics

FluxNode evolution metrics.

```python
@dataclass
class NodeMetrics:
    """Metrics tracking node evolution."""

    total_interactions: int
    structural_transitions: int
    functional_transitions: int
    emergent_behaviors: int

    @property
    def total_mutations(self) -> int:
        """Total number of mutations across all types."""
        return (
            self.structural_transitions +
            self.functional_transitions +
            self.emergent_behaviors
        )
```

---

## Constants

### PERFORMANCE_BUDGETS

Global performance budget configuration.

```python
PERFORMANCE_BUDGETS: Dict[str, Dict[str, Any]] = {
    'evolution_cycle': {
        'max_latency_ms': 200,
        'max_function_calls': 5000
    },
    'memory_exhaustion': {
        'max_duration_ms': 5000,
        'max_object_delta': 1_000_000,
        'max_iterations': 850_000
    },
    'mutation_loop': {
        'max_mutations': 10,
        'max_duration_ms': 1000,
        'max_structural_transitions': 1,
        'max_functional_transitions': 1,
        'max_emergent_behaviors': 1
    },
    'audit_overflow': {
        'max_retrieval_ms': 100,
        'max_serialization_ms': 500,
        'max_audit_size': 10_000,
        'max_retrieval_latency_us': 50
    },
    'threshold_manipulation': {
        'max_exploitable_attacks': 0,
        'max_duration_ms': 2000
    },
    'temporal_anomalies': {
        'max_collision_rate': 0.01,
        'max_duration_ms': 1000
    },
    'concurrency_stress': {
        'max_duration_ms': 3000,
        'max_race_conditions': 0,
        'max_exceptions': 0
    },
    'state_corruption': {
        'min_recovery_rate': 0.8,
        'max_duration_ms': 2000,
        'required_post_corruption_functional': True
    },
    'mutation_cascade': {
        'max_duration_ms': 1500,
        'required_chronological_order': True,
        'expected_mutations': 3
    },
    'recovery_validation': {
        'max_duration_ms': 1000,
        'max_duplicate_mutations': 0
    }
}
```

**Usage**:

```python
from psr_governance.regression_framework import PERFORMANCE_BUDGETS

# Access existing budget
budget = PERFORMANCE_BUDGETS['evolution_cycle']
print(f"Max latency: {budget['max_latency_ms']}ms")

# Add custom budget
PERFORMANCE_BUDGETS['my_custom_test'] = {
    'max_latency_ms': 1000,
    'max_memory_mb': 512
}
```

---

## Functions

### `validate_node_evolution(node)`

Validate a FluxNode's evolution is within acceptable bounds.

```python
def validate_node_evolution(node: FluxNode) -> bool:
    """
    Validate FluxNode evolution is within governance bounds.

    Args:
        node: FluxNode instance to validate

    Returns:
        bool: True if evolution within bounds, False otherwise

    Checks:
        - No more than 3 structural transitions
        - No more than 2 functional transitions
        - No more than 2 emergent behaviors
        - Audit trail size within limits
    """
```

---

## Modules

### `psr_governance.flux_node`

Core FluxNode implementation.

```python
from psr_governance.flux_node import FluxNode
```

**Exports**:
- `FluxNode`: Base class for governed systems

---

### `psr_governance.performance_gate`

Performance profiling and gate enforcement.

```python
from psr_governance.performance_gate import PerformanceGate, PerformanceMetrics
```

**Exports**:
- `PerformanceGate`: Performance validation class
- `PerformanceMetrics`: Performance measurement dataclass

---

### `psr_governance.regression_framework`

Regression detection and baseline management.

```python
from psr_governance.regression_framework import (
    IntegratedTestRunner,
    PerformanceBaseline,
    PERFORMANCE_BUDGETS
)
```

**Exports**:
- `IntegratedTestRunner`: Test runner with regression detection
- `PerformanceBaseline`: Baseline storage and comparison
- `PERFORMANCE_BUDGETS`: Global performance budget configuration

---

### `psr_governance.chaos_suite`

Chaos engineering scenarios.

```python
from psr_governance.chaos_suite import ChaosOrchestrator
```

**Exports**:
- `ChaosOrchestrator`: Chaos scenario execution manager
- `ChaosResult`: Chaos test result dataclass
- Chaos scenario functions:
    - `chaos_memory_exhaustion()`
    - `chaos_mutation_loop()`
    - `chaos_audit_overflow()`

---

### `psr_governance.test_vectors`

Test vectors for comprehensive validation.

```python
import psr_governance.test_vectors as test_vectors
```

**Exports**:
- Test vector functions:
    - `test_v1_concurrency_stress()`
    - `test_v2_state_corruption()`
    - `test_v3_mutation_cascade()`
    - `test_v4_recovery_validation()`

---

## Complete Example

```python
from psr_governance import (
    FluxNode,
    IntegratedTestRunner,
    PerformanceGate,
    PERFORMANCE_BUDGETS
)

# Define your governed system
class MySystem(FluxNode):
    def process(self, data):
        return self.interact(data, "processing")

# Create test
def test_my_system():
    system = MySystem("test")

    # Trigger evolutions
    for i in range(35):
        system.process(i)

    for i in range(10):
        system.process(f"text_{i}")

    return system, {'count': 45}

# Run with governance
runner = IntegratedTestRunner(mode='enforce')
runner.run_test(test_my_system, 'my_test', 'evolution_cycle')
runner.print_summary()

# Access metrics
metrics = gate.evaluate(test_my_system)
print(f"Execution time: {metrics.total_time_ms}ms")
print(f"Function calls: {metrics.total_calls}")
```

---

## Need Help?

- [GitHub Issues](https://github.com/craighckby-stack/psr-governance/issues)
- [Quickstart Guide](quickstart.md)
- [Architecture Guide](architecture.md)
- [Production Deployment](production_deployment.md)
