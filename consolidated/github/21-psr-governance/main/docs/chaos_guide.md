# PSR Governance - Chaos Engineering Guide

Learn how to write custom chaos scenarios and test your self-modifying systems under extreme conditions.

---

## Table of Contents

- [What is Chaos Engineering?](#what-is-chaos-engineering)
- [Why Chaos Testing?](#why-chaos-testing)
- [Built-in Scenarios](#built-in-scenarios)
- [Writing Custom Scenarios](#writing-custom-scenarios)
- [Scenario Templates](#scenario-templates)
- [Best Practices](#best-practices)
- [Integration with CI/CD](#integration-with-cicd)

---

## What is Chaos Engineering?

Chaos engineering is the discipline of experimenting on a system to build confidence in its capability to withstand turbulent conditions in production.

For **self-modifying systems**, chaos testing is critical because:

- Systems evolve in unpredictable ways
- Performance characteristics can drift over time
- Mutation logic may contain hidden bugs
- Resource constraints may be violated unexpectedly

Chaos testing discovers **failure boundaries** before production discovers them for you.

---

## Why Chaos Testing?

### Traditional Testing vs Chaos Testing

| Traditional Testing | Chaos Testing |
|-------------------|---------------|
| Tests happy paths | Tests failure modes |
| Known inputs | Unknown/Adversarial inputs |
| Normal conditions | Extreme conditions |
| Pass/fail metrics | Boundary discovery |

### Benefits for PSR Systems

1. **Discover Real Limits**: Find actual memory, CPU, and latency limits
2. **Validate Safeguards**: Ensure rollback mechanisms trigger correctly
3. **Test Recovery**: Verify systems can return to stable state
4. **Uncover Hidden Bugs**: Find issues only apparent under stress

---

## Built-in Scenarios

PSR Governance includes several built-in chaos scenarios:

### 1. Memory Exhaustion

Discovers allocation limits through progressive load testing:

```python
def chaos_memory_exhaustion():
    node = FluxNode("chaos-memory")

    for i in range(500_000):
        payload = f"CHAOS_DATA_{i}_" + ("X" * 100)
        node.interact(payload, f"chaos_context_{i % 100}")
```

**Discovered Boundary**: ~850K iterations before system limits

### 2. Mutation Loop Detection

Attempts to trigger infinite mutation recursion:

```python
def chaos_mutation_loop():
    node = FluxNode("chaos-mutation-loop")

    for i in range(1000):
        result = node.interact(f"chaos_{i}", "loop_test")
```

**Goal**: Verify mutation thresholds prevent infinite recursion

### 3. Audit Trail Overflow

Tests storage capacity under extreme logging pressure:

```python
def chaos_audit_overflow():
    node = FluxNode("chaos-audit")

    for i in range(5_000):
        node.interact(i, "audit_stress")
```

**Metric**: Retrieval latency at scale

### 4. Threshold Manipulation

Tests adversarial parameter injection:

```python
def chaos_threshold_manipulation():
    node = FluxNode("chaos-threshold")
    node.STRUCTURAL_THRESHOLD = 0  # Extreme value
    node.FUNCTIONAL_THRESHOLD = 1_000_000  # Extreme value
```

### 5. Temporal Anomalies

Tests clock skew and timestamp corruption handling.

---

## Writing Custom Scenarios

### Scenario Template

All chaos scenarios follow this pattern:

```python
def chaos_custom_scenario():
    """
    Brief description of what this scenario tests.
    """
    print("Initializing custom scenario...")

    node = FluxNode("custom-test")

    try:
        # Your chaos logic here
        for i in range(iterations):
            result = node.interact(data, context)

            # Check for violations
            if violation_detected:
                print(f"⚠️  Violation: {violation}")
                break

        survived = True
        boundary = None

    except Exception as e:
        survived = False
        boundary = f"Failure at iteration {i}: {e}"

    mitigations = []
    if violation_detected:
        mitigations.append("Fix the violation...")

    return {
        'survived': survived,
        'recovery_possible': True,
        'boundary_discovered': boundary,
        'mitigation_required': mitigations
    }
```

### Key Elements

1. **Initialization**: Set up a FluxNode
2. **Chaos Injection**: Push system beyond normal parameters
3. **Violation Detection**: Check for failures/crashes
4. **Boundary Discovery**: Record where system fails
5. **Mitigation**: Suggest fixes

---

## Scenario Templates

### Template 1: Resource Exhaustion

Test system under resource constraints:

```python
def chaos_resource_exhaustion(resource_type='memory'):
    """
    Test system behavior under resource starvation.
    """
    node = FluxNode(f"chaos-{resource_type}")

    if resource_type == 'memory':
        # Memory exhaustion test
        for i in range(1_000_000):
            large_data = "X" * 10_000
            node.interact(large_data, "memory_test")

    elif resource_type == 'cpu':
        # CPU exhaustion test
        import time
        for i in range(10_000):
            time.sleep(0.001)
            node.interact(i, "cpu_test")
```

### Template 2: Adversarial Input

Test system resilience against malicious inputs:

```python
def chaos_adversarial_input():
    """
    Test system with adversarial input patterns.
    """
    node = FluxNode("chaos-adversarial")

    adversarial_inputs = [
        None,  # Null input
        "",  # Empty string
        "A" * 1_000_000,  # Oversized input
        {"nested": {"deep": {"structure": "yes"}}},  # Complex nested
        1e1000,  # Overflow value
        "\x00\x01\x02",  # Binary data
    ]

    for i, input_data in enumerate(adversarial_inputs):
        try:
            result = node.interact(input_data, "adversarial")
            print(f"  Input {i}: ✓ Handled")
        except Exception as e:
            print(f"  Input {i}: ✗ Failed - {e}")
```

### Template 3: Concurrent Evolution

Test thread safety during parallel mutations:

```python
def chaos_concurrent_evolution():
    """
    Test system behavior under concurrent mutations.
    """
    from threading import Thread
    import queue

    node = FluxNode("chaos-concurrent")
    results = queue.Queue()

    def worker(worker_id):
        for i in range(1000):
            result = node.interact(f"worker_{worker_id}_{i}", "concurrent")
        results.put(worker_id)

    # Spawn 10 concurrent workers
    threads = [Thread(target=worker, args=(i,)) for i in range(10)]

    for t in threads:
        t.start()

    for t in threads:
        t.join()

    print(f"Completed {results.qsize()} workers without crashes")
```

---

## Best Practices

### 1. Start Conservative

Begin with conservative limits to avoid destroying your development machine:

```python
# Good
max_iterations = 1_000

# Risky
max_iterations = 10_000_000
```

### 2. Use Timeouts

Protect against infinite loops:

```python
import signal

def timeout_handler(signum, frame):
    raise TimeoutError("Scenario timeout")

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(60)  # 60 second timeout

try:
    # Run chaos scenario
    chaos_my_scenario()
finally:
    signal.alarm(0)
```

### 3. Log Telemetry

Capture detailed metrics:

```python
import time
import gc

def chaos_with_telemetry():
    node = FluxNode("chaos-telemetry")

    start_objects = len(gc.get_objects())
    start_time = time.perf_counter()

    # Run scenario...

    end_objects = len(gc.get_objects())
    end_time = time.perf_counter()

    metrics = {
        'duration_ms': (end_time - start_time) * 1000,
        'object_delta': end_objects - start_objects,
        'mutations': node.metrics.total_mutations
    }

    print(f"Metrics: {metrics}")
```

### 4. Test Recovery

Ensure system can recover:

```python
def chaos_recovery_test():
    node = FluxNode("chaos-recovery")

    # 1. Push to failure
    try:
        for i in range(1_000_000):
            node.interact("data", "test")
    except MemoryError:
        print("💥 System reached limit")

    # 2. Verify recovery
    state = node.get_state_snapshot()
    assert state is not None, "System failed to recover"

    # 3. Test continued operation
    result = node.interact("recovery", "test")
    assert result, "System non-functional after recovery"
```

### 5. Isolate Scenarios

Run each scenario in isolation:

```python
def main():
    orchestrator = ChaosOrchestrator()

    # Run scenarios independently
    orchestrator.execute_scenario(chaos_memory, "Memory")
    orchestrator.execute_scenario(chaos_adversarial, "Adversarial")
    orchestrator.execute_scenario(chaos_concurrent, "Concurrent")

    orchestrator.print_chaos_report()
```

---

## Integration with CI/CD

### GitHub Actions Example

Add chaos testing to your CI/CD pipeline:

```yaml
# .github/workflows/chaos-tests.yml
name: Chaos Engineering Tests

on: [push, pull_request]

jobs:
  chaos:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install PSR Governance
        run: pip install psr-governance

      - name: Run Chaos Suite
        run: python -m psr_governance.chaos_suite

      - name: Upload Chaos Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: chaos-report
          path: chaos_report.json
```

### Scheduling Regular Chaos Tests

Run chaos tests weekly to catch regressions:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

---

## Advanced Topics

### Discovering Performance Budgets

Chaos testing is how you discover the values for `PERFORMANCE_BUDGETS`:

```python
# 1. Run chaos scenario
result = chaos_memory_exhaustion()

# 2. Extract discovered boundary
boundary = result['boundary_discovered']
# e.g., "Memory exhaustion at 847K iterations"

# 3. Set budget with safety margin
PERFORMANCE_BUDGETS['memory_exhaustion'] = {
    'max_iterations': 847_000 * 0.8  # 20% safety margin
}
```

### Boundary Exploration

Binary search to find exact failure point:

```python
def find_exact_boundary():
    low = 0
    high = 1_000_000

    while high - low > 1000:
        mid = (low + high) // 2

        try:
            node = FluxNode("boundary-test")
            for i in range(mid):
                node.interact(f"data_{i}", "test")
            low = mid
        except:
            high = mid

    print(f"Exact boundary: {low:,} iterations")
    return low
```

---

## Examples

See the chaos suite implementation for complete examples:

```bash
python -m psr_governance.chaos_suite
```

Output:

```
╔══════════════════════════════════════════════════════════════════╗
║  PSR FluxNode - Chaos Engineering Suite                          ║
║  Exploring System Boundaries Under Extreme Adversarial Conditions║
╚══════════════════════════════════════════════════════════════════╝

⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡
CHAOS SCENARIO: Scenario 1: Memory Exhaustion
⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡

[⚡ SURVIVED] Scenario 1: Memory Exhaustion

======================================================================
CHAOS ENGINEERING REPORT
======================================================================

Scenarios Executed: 3
System Survived: 3/3
Survival Rate: 100.0%

✓ System demonstrated resilience across all chaos scenarios
```

---

## Need Help?

- [GitHub Issues](https://github.com/craighckby-stack/psr-governance/issues)
- [Architecture Guide](architecture.md)
- [Quickstart Tutorial](quickstart.md)

---

**Remember:** Chaos testing is about building confidence, not destroying systems. Start small, iterate, and discover your system's true boundaries. 🛡️
