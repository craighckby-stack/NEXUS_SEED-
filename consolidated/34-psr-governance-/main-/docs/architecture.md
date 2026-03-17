# PSR Governance Architecture

Deep dive into the architecture, principles, and design decisions behind PSR Governance Framework.

---

## 📋 Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Core Principles](#core-principles)
- [System Architecture](#system-architecture)
- [Component Design](#component-design)
- [Design Decisions](#design-decisions)

---

## 🎯 The Problem

### Self-Modifying Systems Are Different

Traditional software is static—you test it once, deploy it, and it behaves predictably.

**Self-modifying systems** change themselves:

| System Type | How It Changes | Risk |
|-------------|-----------------|-------|
| ML Models | Retrain nightly, adapt architecture | Silent accuracy degradation |
| Microservices | Auto-scale based on load | Cost explosion, performance issues |
| CI/CD Pipelines | Optimize execution order | Broken builds, no rollback |

**The paradox**: The system you deploy is not the system running in production.

### Why Traditional Testing Fails

```
Traditional Testing:
├─ Functional tests (does it work?)
├─ Performance tests (is it fast?)
└─ Security tests (is it safe?)
   → Validated independently
   → Gaps between dimensions allow failure
   → No temporal tracking across deployments

Self-Modifying System (Ungoverned):
├─ System evolves... we don't know into what.
├─ Performance degrades 2% per week
├─ After 6 months: 27% slower
└─ No single commit triggered alarm
```

---

## ✨ The Solution

### PSR Governance Framework

A **unified control plane** for self-modifying systems that ensures:

1. **Integrated Architecture** - Single atomic gate for all quality dimensions
2. **Situational Fidelity** - Constraints from real operational boundaries
3. **Iterative Depth** - Continuous validation across commits

### The Governance Equation

```
SystemSafety = 
    IntegratedArchitecture(functional, performance, chaos) 
    ∧ SituationalFidelity(empirical_boundaries, chaos_budgets)
    ∧ IterativeDepth(baseline_tracking, regression_detection, rollback)
```

---

## 🔬 Core Principles

### 1️⃣ Integrated Architecture

**Definition**: Collapse dimensional fragmentation in validation

**Traditional CI/CD**:
```
├─ Functional tests → PASS
├─ Performance tests → FAIL
└─ Security tests → PASS

Result: Deployed (performance failure ignored)
```

**PSR Governance**:
```
└─ Unified Gate 4
   ├─ Functional correctness
   ├─ Performance budgets
   ├─ Resource constraints
   └─ Chaos validation

Result: BLOCKED (any dimension fails = all fail)
```

**Implementation**:

```python
class IntegratedTestRunner:
    def run_test(self, test_func, test_name, budget_name):
        # 1. Execute test
        metrics = test_func()
        
        # 2. Check all dimensions
        budget_violations = self._check_budgets(budget_name, metrics)
        regressions = self._detect_regressions(test_name, metrics)
        exceptions = self._catch_exceptions()
        
        # 3. Atomic decision
        passed = (
            len(exceptions) == 0 and
            len(budget_violations) == 0 and
            not any(r.is_regression for r in regressions)
        )
        
        return TestResult(passed=passed, ...)
```

### 2️⃣ Situational Fidelity

**Definition**: Convert chaos exploration into operational law

**Chaos Engineering** discovers boundaries:

```python
# Chaos test discovers limit
chaos_memory_exhaustion()
→ Memory exhaustion at 847,293 iterations
→ Object delta: ~1,000,000
```

**PSR Governance** converts to enforceable budget:

```python
PERFORMANCE_BUDGETS = {
    'memory_exhaustion': {
        'max_object_delta': 1_000_000,  # From chaos test
        'max_iterations': 850_000       # Safety margin
    }
}
```

**Key Property**: Budgets are **measured failure points**, not guesses.

### 3️⃣ Iterative Depth

**Definition**: Prevent gradual boundary erosion through statistical vigilance

**The Drift Problem**:

```
Week 1:  200ms → 205ms (+2.5%)  ✓ "Acceptable noise"
Week 2:  205ms → 210ms (+2.4%)  ✓ "Still acceptable"
Week 10: 250ms → 255ms (+2.0%)  ✓ "Each step small"

Result:  200ms → 255ms (+27.5%) ✗ CRITICAL
But no single commit triggered alert!
```

**PSR Governance** Solution:

```python
class RegressionDetector:
    THRESHOLDS = {
        'latency_ms': 10.0  # 10% = regression
    }
    
    def detect_regression(self, metric_name, baseline, current):
        delta = ((current - baseline) / baseline) * 100
        
        if delta > threshold:
            severity = self._classify_severity(delta)
            return RegressionResult(is_regression=True, severity=severity)
```

**Result**: Drift detected early at **Week 2**, never reaches critical.

---

## 🏗️ System Architecture

### High-Level View

```
┌─────────────────────────────────────────────────────────────┐
│              PSR GOVERNANCE FRAMEWORK                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────┐              │
│  │   Core Layer                            │              │
│  ├─ FluxNode (self-modifying system)      │              │
│  │   ├─ Structural evolution               │              │
│  │   ├─ Functional adaptation             │              │
│  │   └─ Emergent behavior               │              │
│  └────────────────────────────────────────────┘              │
│                        ↓                                   │
│  ┌────────────────────────────────────────────┐              │
│  │   Testing Layer                         │              │
│  ├─ Test Vectors (V1-V4)                │              │
│  ├─ Chaos Scenarios (5 boundaries)        │              │
│  └─ Regression Framework                 │              │
│  └────────────────────────────────────────────┘              │
│                        ↓                                   │
│  ┌────────────────────────────────────────────┐              │
│  │   Governance Layer                     │              │
│  ├─ Baseline Manager                     │              │
│  ├─ Regression Detector                  │              │
│  ├─ Budget Enforcer                     │              │
│  └─ Unified Reporter                     │              │
│  └────────────────────────────────────────────┘              │
│                        ↓                                   │
│  ┌────────────────────────────────────────────┐              │
│  │   CI/CD Layer                          │              │
│  ├─ Static Analysis (Gate 1)              │              │
│  ├─ Functional Tests (Gate 2)             │              │
│  ├─ Chaos Engineering (Gate 3)           │              │
│  ├─ Performance Regression (Gate 4)       │              │
│  └─ Integration Report (Gate 5)          │              │
│  └────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. System Evolution
   ↓
2. Test Execution (Functional + Chaos)
   ↓
3. Metrics Collection
   ↓
4. Baseline Comparison
   ↓
5. Budget Enforcement
   ↓
6. Regression Detection
   ↓
7. Gate Decision (PASS/FAIL)
   ↓
8. Baseline Update (if passed)
```

---

## 🧩 Component Design

### FluxNode (Core Self-Modifying System)

**Purpose**: Base class for self-modifying systems

**Responsibilities**:
- Automatic structural evolution (list → set)
- Automatic functional adaptation (strategy pattern)
- Automatic emergent behavior spawning
- Complete audit trail of all mutations

**Key Methods**:

```python
class FluxNode:
    def interact(self, data: Any, context: str) -> Dict:
        """Primary interface. Triggers PSR evaluation."""
        
        # 1. Record interaction
        self.metrics.record(data, context)
        
        # 2. Evaluate triggers
        if self._should_refine_structure():
            self._evolve_structure()
        
        if self._should_adapt_strategy(data):
            self._evolve_strategy(data)
        
        if self._should_spawn_behavior(context):
            self._spawn_emergent_method(context)
        
        # 3. Process and return
        return {
            'processed': self._processing_strategy(data),
            'mutations_triggered': mutations,
            'current_state': self._get_state_snapshot()
        }
```

### PerformanceGate (Profiling Harness)

**Purpose**: Validate performance budgets

**Responsibilities**:
- cProfiling instrumentation
- Metric collection
- Budget enforcement
- Hotspot identification

**Key Methods**:

```python
class PerformanceGate:
    def evaluate(self, test_func: Callable) -> bool:
        """Execute test with performance profiling."""
        
        profiler = cProfile.Profile()
        profiler.enable()
        
        start = time.perf_counter()
        test_func()
        end = time.perf_counter()
        
        profiler.disable()
        
        total_time = (end - start) * 1000
        total_calls = profiler.total_calls
        
        # Enforce budgets
        if total_time > self.max_latency_ms:
            self._fail("Latency violation")
        
        if total_calls > self.max_function_calls:
            self._fail("Call limit violation")
        
        return True
```

### ChaosOrchestrator (Boundary Discovery)

**Purpose**: Explore failure modes under extreme conditions

**Responsibilities**:
- Scenario orchestration
- Resource monitoring
- Boundary discovery
- Mitigation recommendation

**Key Methods**:

```python
class ChaosOrchestrator:
    def execute_scenario(self, scenario_func, name: str) -> ChaosResult:
        """Execute chaos scenario with full isolation."""
        
        # Resource baseline
        baseline_objects = len(gc.get_objects())
        
        try:
            result = scenario_func()
            survived = True
        except MemoryError:
            survived = False
            boundary = f"Memory exhaustion at {iteration}"
        
        # Forensic analysis
        object_delta = len(gc.get_objects()) - baseline_objects
        
        return ChaosResult(
            survived=survived,
            boundary_discovered=boundary,
            resource_metrics={'object_delta': object_delta}
        )
```

### IntegratedTestRunner (Unified Testing)

**Purpose**: Orchestrate all testing dimensions

**Responsibilities**:
- Test execution
- Budget enforcement
- Regression detection
- Gate decision

**Key Methods**:

```python
class IntegratedTestRunner:
    def run_test(self, test_func, test_name, budget_name):
        """Execute single test with full instrumentation."""
        
        # 1. Execute
        metrics = test_func()
        
        # 2. Budget enforcement
        violations = self._check_budgets(budget_name, metrics)
        
        # 3. Regression detection
        regressions = self._detect_regressions(test_name, metrics)
        
        # 4. Gate decision
        passed = (
            len(violations) == 0 and
            not any(r.is_regression for r in regressions)
        )
        
        return TestResult(passed=passed, ...)
```

---

## 🎨 Design Decisions

### 1. Why Not Separate Test Suites?

**Traditional Approach**:
```
unit_tests.py
performance_tests.py
chaos_tests.py
regression_tests.py

→ Run independently
→ Gaps between dimensions
→ No unified gate
```

**PSR Approach**:
```
IntegratedTestRunner:
  ├─ Functional (V1-V4)
  ├─ Chaos (5 scenarios)
  └─ Regression (statistical)

→ Single execution
→ Atomic gate decision
→ Unified metrics
```

### 2. Why cProfile Over pytest-profiling?

**Choice**: cProfile (standard library)

**Rationale**:
- No additional dependencies
- Production-ready reliability
- Comprehensive call tree
- Works in all CI environments

**Alternative**: pytest-profiling
- Not available in all environments
- Less precise for call count tracking

### 3. Why JSON for Baselines?

**Choice**: JSON serialization

**Rationale**:
- Human-readable for inspection
- Easy to debug
- Git-friendly (diffable)
- Version-controllable

**Alternative**: Binary formats (pickle)
- Faster to read/write
- Not human-readable
- Diff-unfriendly

### 4. Why Severity Classification?

**Choice**: Minor/Major/Critical severity levels

**Rationale**:
- Enables graduated response
- Validate mode can warn on minor
- Enforce mode blocks only critical
- Provides actionable feedback

**Decision Matrix**:

| Severity | Delta % | Mode: Validate | Mode: Enforce |
|----------|-----------|----------------|----------------|
| None | <10% | ✓ PASS | ✓ PASS |
| Minor | 10-15% | ⚠️ WARN | ⚠️ WARN |
| Major | 15-20% | ⚠️ WARN | 🚫 BLOCK |
| Critical | >20% | ⚠️ WARN | ❌ FAIL |

---

## 📚 Theoretical Foundation

### System Safety Theorem

```
If SystemSafety holds at commit N,
and all gates pass for commit N+1,
then SystemSafety holds at commit N+1

→ Safety is preserved across evolutionary transitions
```

### Proof Sketch

1. **Integrated Architecture**: All dimensions validated atomically
   - If commit N+1 passes Gate 4, all dimensions are satisfied
   - No dimensional gaps exist

2. **Situational Fidelity**: Budgets from empirical boundaries
   - Chaos-tested boundaries are real operational limits
   - Within limits = safe operation

3. **Iterative Depth**: Regression detection prevents drift
   - Each commit compared against baseline
   - Drift detected before critical threshold

**Therefore**: SystemSafety is preserved at N+1.

---

## 🚀 Extensibility

### Adding New Chaos Scenarios

```python
def chaos_custom_scenario():
    """Your custom chaos test."""
    node = FluxNode("custom")
    
    # Your chaos logic
    for i in range(100000):
        node.interact(i, "chaos")
    
    return {
        'survived': True,
        'mitigation_required': []
    }

# Register with orchestrator
orchestrator.execute_scenario(
    chaos_custom_scenario,
    "Custom Scenario"
)
```

### Adding New Test Vectors

```python
def vector_custom_test():
    """Your custom test vector."""
    node = MySystem("custom")
    
    # Test logic
    node.interact("test", "context")
    
    # Return node and metrics
    return node, {'metric': value}

# Register with harness
harness.run_vector(
    vector_custom_test,
    "Custom Vector"
)
```

### Adding New Budgets

```python
from psr_governance.regression_framework import PERFORMANCE_BUDGETS

PERFORMANCE_BUDGETS['custom_budget'] = {
    'max_latency_ms': 1000,
    'max_memory_mb': 512,
    'min_throughput': 1000
}
```

---

## 📖 Further Reading

- [Quickstart Guide](quickstart.md) - Get started in 5 minutes
- [Chaos Engineering Guide](chaos_guide.md) - Test under extreme conditions
- [Production Deployment](production_deployment.md) - Run in production

---

**Built by Craig Huckerby** 🛡️

*"Transforming uncertainty into evidence for self-modifying systems."*
