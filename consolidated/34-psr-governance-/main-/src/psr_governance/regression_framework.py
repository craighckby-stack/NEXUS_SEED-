"""
Integrated Performance Regression Framework
======================================

Unified testing harness that enforces both functional correctness
and non-functional resource boundaries discovered through chaos engineering.

Components:
- Baseline Management: Historical performance tracking
- Regression Detection: Statistical anomaly identification
- Budget Enforcement: Hard limits from chaos scenarios
- Unified Reporting: Single source of truth for CI/CD gating

Usage:
    >>> runner = IntegratedTestRunner(mode='enforce')
    >>> runner.run_test(test_func, "my_test", "my_budget")
    >>> gate_passed = runner.print_summary()
"""

import json
import sys
import time
import os
import gc
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import statistics


# ========================================================================
# PERFORMANCE BUDGETS (Discovered via Chaos Engineering)
# ========================================================================

PERFORMANCE_BUDGETS = {
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
        'min_recovery_rate': 0.80,
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


# ========================================================================
# BASELINE MANAGEMENT
# ========================================================================

@dataclass
class PerformanceBaseline:
    """Historical performance metrics for regression detection."""
    test_name: str
    timestamp: str
    git_commit: str
    metrics: Dict[str, float]
    budget_status: Dict[str, bool]
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'PerformanceBaseline':
        return cls(**data)


class BaselineManager:
    """Manages performance baseline storage and retrieval."""
    
    def __init__(self, baseline_dir: Path = Path('.performance_baselines')):
        self.baseline_dir = baseline_dir
        self.baseline_dir.mkdir(exist_ok=True)
    
    def save_baseline(self, baseline: PerformanceBaseline):
        """Persist baseline to disk."""
        filepath = self.baseline_dir / f"{baseline.test_name}.json"
        
        with open(filepath, 'w') as f:
            json.dump(baseline.to_dict(), f, indent=2)
        
        if os.getenv('CI'):
            print(f"✓ Baseline saved: {filepath}")
    
    def load_baseline(self, test_name: str) -> Optional[PerformanceBaseline]:
        """Load historical baseline for comparison."""
        filepath = self.baseline_dir / f"{test_name}.json"
        
        if not filepath.exists():
            return None
        
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        return PerformanceBaseline.from_dict(data)


# ========================================================================
# REGRESSION DETECTION
# ========================================================================

@dataclass
class RegressionResult:
    """Result of regression analysis."""
    metric_name: str
    baseline_value: float
    current_value: float
    delta_percent: float
    is_regression: bool
    severity: str  # 'none', 'minor', 'major', 'critical'
    
    def __str__(self):
        arrow = "📈" if self.delta_percent > 0 else "📉"
        status = "⚠️ REGRESSION" if self.is_regression else "✓"
        return (f"[{status}] {self.metric_name}: "
                f"{self.baseline_value:.2f} → {self.current_value:.2f} "
                f"({arrow} {abs(self.delta_percent):.1f}%)")


class RegressionDetector:
    """Statistical regression analysis engine."""
    
    # Regression thresholds (% increase)
    THRESHOLDS = {
        'latency_ms': 10.0,
        'object_delta': 15.0,
        'duration_ms': 10.0,
        'collision_rate': 5.0,
        'retrieval_ms': 10.0
    }
    
    def detect_regression(
        self,
        metric_name: str,
        baseline_value: float,
        current_value: float
    ) -> RegressionResult:
        """Compare current metric against baseline."""
        
        if baseline_value == 0:
            delta_percent = 100.0 if current_value > 0 else 0.0
        else:
            delta_percent = ((current_value - baseline_value) / baseline_value) * 100
        
        # Determine if this is a regression
        threshold = self._get_threshold(metric_name)
        is_regression = delta_percent > threshold
        
        # Severity classification
        if not is_regression:
            severity = 'none'
        elif delta_percent < threshold * 1.5:
            severity = 'minor'
        elif delta_percent < threshold * 2.0:
            severity = 'major'
        else:
            severity = 'critical'
        
        return RegressionResult(
            metric_name=metric_name,
            baseline_value=baseline_value,
            current_value=current_value,
            delta_percent=delta_percent,
            is_regression=is_regression,
            severity=severity
        )
    
    def _get_threshold(self, metric_name: str) -> float:
        """Get regression threshold for metric."""
        for pattern, threshold in self.THRESHOLDS.items():
            if pattern in metric_name.lower():
                return threshold
        
        return 10.0  # Default threshold


# ========================================================================
# UNIFIED TEST EXECUTION
# ========================================================================

@dataclass
class TestExecutionResult:
    """Complete test execution outcome."""
    test_name: str
    passed: bool
    duration_ms: float
    metrics: Dict[str, Any]
    budget_violations: List[str]
    regressions: List[RegressionResult]
    exceptions: List[str]
    
    def __str__(self):
        status = "✓ PASS" if self.passed else "✗ FAIL"
        return f"[{status}] {self.test_name} ({self.duration_ms:.2f}ms)"


class IntegratedTestRunner:
    """Unified test execution with budget enforcement and regression detection."""
    
    def __init__(self, mode: str = 'validate'):
        """
        Initialize test runner.
        
        Args:
            mode: 'baseline' (establish baseline), 'validate' (compare), 'enforce' (hard-fail)
        """
        if mode not in ['baseline', 'validate', 'enforce']:
            raise ValueError(f"Invalid mode: {mode}. Must be 'baseline', 'validate', or 'enforce'")
        
        self.mode = mode
        self.baseline_manager = BaselineManager()
        self.regression_detector = RegressionDetector()
        self.results: List[TestExecutionResult] = []
    
    def run_test(
        self,
        test_func,
        test_name: str,
        budget_name: str
    ) -> TestExecutionResult:
        """Execute single test with full instrumentation."""
        
        if os.getenv('CI'):
            print(f"\n{'='*70}")
            print(f"EXECUTING: {test_name}")
            print(f"Mode: {self.mode.upper()} | Budget: {budget_name}")
            print(f"{'='*70}")
        
        # Resource baseline
        gc.collect()
        baseline_objects = len(gc.get_objects())
        
        start_time = time.perf_counter()
        exceptions = []
        
        try:
            # Execute test
            test_result = test_func()
            
            # Extract metrics (normalize different return formats)
            if isinstance(test_result, tuple):
                node, metrics = test_result
            elif isinstance(test_result, dict):
                metrics = test_result
            else:
                metrics = {}
            
        except Exception as e:
            print(f"💥 TEST FAILURE: {e}")
            exceptions.append(str(e))
            metrics = {}
        
        end_time = time.perf_counter()
        
        # Calculate resources
        gc.collect()
        post_objects = len(gc.get_objects())
        duration_ms = (end_time - start_time) * 1000
        
        # Augment metrics with universal measurements
        metrics.update({
            'duration_ms': duration_ms,
            'object_delta': post_objects - baseline_objects
        })
        
        # Budget enforcement
        budget_violations = self._check_budgets(budget_name, metrics)
        
        # Regression detection
        regressions = []
        if self.mode in ['validate', 'enforce']:
            regressions = self._detect_regressions(test_name, metrics)
        
        # Determine pass/fail
        passed = (
            len(exceptions) == 0 and
            len(budget_violations) == 0 and
            (self.mode != 'enforce' or not any(r.is_regression for r in regressions))
        )
        
        result = TestExecutionResult(
            test_name=test_name,
            passed=passed,
            duration_ms=duration_ms,
            metrics=metrics,
            budget_violations=budget_violations,
            regressions=regressions,
            exceptions=exceptions
        )
        
        self.results.append(result)
        
        if os.getenv('CI'):
            print(f"\n{result}")
            
            if budget_violations:
                print("\nBudget Violations:")
                for violation in budget_violations:
                    print(f"  ❌ {violation}")
            
            if regressions:
                print("\nRegression Analysis:")
                for regression in regressions:
                    if regression.is_regression:
                        print(f"  {regression}")
        
        # Save baseline in baseline mode
        if self.mode == 'baseline':
            self._save_baseline(test_name, metrics)
        
        return result
    
    def _check_budgets(self, budget_name: str, metrics: Dict[str, Any]) -> List[str]:
        """Enforce performance budgets."""
        violations = []
        
        if budget_name not in PERFORMANCE_BUDGETS:
            return violations
        
        budget = PERFORMANCE_BUDGETS[budget_name]
        
        for key, limit in budget.items():
            metric_key = key.replace('max_', '').replace('min_', '').replace('required_', '')
            
            if metric_key not in metrics:
                continue
            
            actual = metrics[metric_key]
            
            # Max constraints
            if key.startswith('max_') and actual > limit:
                violations.append(
                    f"{metric_key}: {actual} exceeds max {limit}"
                )
            
            # Min constraints
            elif key.startswith('min_') and actual < limit:
                violations.append(
                    f"{metric_key}: {actual} below min {limit}"
                )
            
            # Boolean requirements
            elif key.startswith('required_') and actual != limit:
                violations.append(
                    f"{metric_key}: required={limit}, got={actual}"
                )
        
        return violations
    
    def _detect_regressions(self, test_name: str, current_metrics: Dict) -> List[RegressionResult]:
        """Compare against historical baseline."""
        baseline = self.baseline_manager.load_baseline(test_name)
        
        if not baseline:
            if os.getenv('CI'):
                print(f"  ℹ️  No baseline found for {test_name}")
            return []
        
        regressions = []
        
        for metric_name, current_value in current_metrics.items():
            if metric_name not in baseline.metrics:
                continue
            
            baseline_value = baseline.metrics[metric_name]
            
            # Skip non-numeric metrics
            if not isinstance(current_value, (int, float)):
                continue
            
            regression = self.regression_detector.detect_regression(
                metric_name, baseline_value, current_value
            )
            
            regressions.append(regression)
        
        return regressions
    
    def _save_baseline(self, test_name: str, metrics: Dict):
        """Save current run as baseline."""
        git_commit = os.getenv('GITHUB_SHA', 'local')
        
        # Determine budget status
        budget_status = {}
        for budget_name, budget in PERFORMANCE_BUDGETS.items():
            violations = self._check_budgets(budget_name, metrics)
            budget_status[budget_name] = len(violations) == 0
        
        baseline = PerformanceBaseline(
            test_name=test_name,
            timestamp=datetime.now().isoformat(),
            git_commit=git_commit,
            metrics=metrics,
            budget_status=budget_status
        )
        
        self.baseline_manager.save_baseline(baseline)
    
    def print_summary(self) -> bool:
        """Generate comprehensive test summary."""
        print(f"\n{'='*70}")
        print("INTEGRATED PERFORMANCE REGRESSION REPORT")
        print(f"{'='*70}")
        print(f"Mode: {self.mode.upper()}")
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        
        print(f"\nTests Executed: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Budget violation summary
        total_violations = sum(len(r.budget_violations) for r in self.results)
        if total_violations > 0:
            print(f"\n⚠️  Total Budget Violations: {total_violations}")
        
        # Regression summary
        total_regressions = sum(
            sum(1 for reg in r.regressions if reg.is_regression)
            for r in self.results
        )
        if total_regressions > 0:
            print(f"⚠️  Total Regressions Detected: {total_regressions}")
            
            # Severity breakdown
            severity_counts = {'minor': 0, 'major': 0, 'critical': 0}
            for result in self.results:
                for reg in result.regressions:
                    if reg.is_regression:
                        severity_counts[reg.severity] += 1
            
            print(f"  Minor: {severity_counts['minor']}")
            print(f"  Major: {severity_counts['major']}")
            print(f"  Critical: {severity_counts['critical']}")
        
        # Performance summary
        total_duration = sum(r.duration_ms for r in self.results)
        print(f"\nTotal Execution Time: {total_duration:.2f}ms")
        print(f"Average Test Duration: {total_duration/total:.2f}ms")
        
        # Gate decision
        if self.mode == 'baseline':
            print("\n✓ Baselines established successfully")
            return True
        
        elif self.mode == 'validate':
            if passed == total:
                print("\n✓ All tests passed budget validation")
                if total_regressions > 0:
                    print("  ⚠️  Regressions detected but not enforced in validate mode")
                return True
            else:
                print("\n✗ Budget violations detected")
                return False
        
        elif self.mode == 'enforce':
            critical_regressions = sum(
                1 for r in self.results
                for reg in r.regressions
                if reg.severity == 'critical'
            )
            
            if passed == total and critical_regressions == 0:
                print("\n✓ All tests passed with no critical regressions")
                return True
            else:
                print("\n✗ Critical failures or regressions detected")
                return False
        
        return False


if __name__ == "__main__":
    # Demo usage
    from .flux_node import FluxNode
    
    def test_evolution_cycle():
        node = FluxNode("demo")
        
        for i in range(50):
            node.interact(i, "stress_test")
        
        node.interact("Context Shift", "calibration")
        
        for _ in range(10):
            node.interact("Keep-Alive", "ping")
        
        return node, {
            'interactions': node.metrics.total_interactions,
            'structural_transitions': node.metrics.structural_transitions,
            'functional_transitions': node.metrics.functional_transitions,
            'emergent_behaviors': node.metrics.emergent_behaviors
        }
    
    runner = IntegratedTestRunner(mode='baseline')
    runner.run_test(test_evolution_cycle, "evolution_cycle", "evolution_cycle")
    runner.print_summary()
