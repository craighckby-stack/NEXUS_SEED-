"""
Performance Gate - Profiling Harness
===================================

Validates that PSR evolution meets performance budgets.
Ensures adaptive systems remain efficient under load.

Usage:
    >>> from psr_governance import PerformanceGate
    >>> gate = PerformanceGate(max_latency_ms=200, max_calls=5000)
    >>> gate.evaluate(lambda: profile_evolution_cycle())
    >>> gate.print_report()
"""

import cProfile
import pstats
import io
import sys
import time
from typing import Callable, Optional
from dataclasses import dataclass


@dataclass
class PerformanceMetrics:
    """Captured performance telemetry."""
    total_time_ms: float
    total_calls: int
    latency_violation: bool
    call_limit_violation: bool
    top_functions: list


class PerformanceGate:
    """
    Performance validation gate with configurable thresholds.
    
    Attributes:
        max_latency_ms: Maximum allowed execution time (default: 200ms)
        max_function_calls: Maximum allowed function invocations (default: 5000)
        verbose: Enable detailed output
    """
    
    def __init__(
        self,
        max_latency_ms: float = 200,
        max_function_calls: int = 5000,
        verbose: bool = True
    ):
        self.max_latency_ms = max_latency_ms
        self.max_function_calls = max_function_calls
        self.verbose = verbose
        
        self._metrics: Optional[PerformanceMetrics] = None
    
    def evaluate(self, test_func: Callable) -> bool:
        """
        Execute test function with performance profiling.
        
        Args:
            test_func: Function to profile
            
        Returns:
            bool: True if performance budgets satisfied, False otherwise
        """
        profiler = cProfile.Profile()
        profiler.enable()
        
        start_time = time.perf_counter()
        
        try:
            if self.verbose:
                print(f">>> Initializing Performance Gate...")
                print(f">>> Budgets: {self.max_latency_ms}ms latency, {self.max_function_calls} max calls")
            
            test_func()
            
        except Exception as e:
            print(f"!!! Test execution failed: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        end_time = time.perf_counter()
        profiler.disable()
        
        # Capture metrics
        total_time_ms = (end_time - start_time) * 1000
        
        s = io.StringIO()
        ps = pstats.Stats(profiler, stream=s).sort_stats('cumulative')
        total_calls = ps.total_calls
        
        # Extract top 10 functions
        ps.print_stats(10)
        top_functions = self._parse_top_functions(s.getvalue())
        
        # Evaluate gates
        latency_violation = total_time_ms > self.max_latency_ms
        call_limit_violation = total_calls > self.max_function_calls
        
        self._metrics = PerformanceMetrics(
            total_time_ms=total_time_ms,
            total_calls=total_calls,
            latency_violation=latency_violation,
            call_limit_violation=call_limit_violation,
            top_functions=top_functions
        )
        
        if self.verbose:
            self._print_results()
        
        # Exit with failure code if violated
        if latency_violation or call_limit_violation:
            sys.exit(1)
        
        return True
    
    def _parse_top_functions(self, stats_output: str) -> list:
        """Extract top 10 functions from pstats output."""
        lines = stats_output.split('\n')
        functions = []
        
        for line in lines:
            if 'ncalls' in line:
                continue  # Skip header
            if line.strip() and not line.startswith('   '):
                parts = line.split()
                if len(parts) >= 6:
                    functions.append({
                        'ncalls': parts[0],
                        'tottime': parts[1],
                        'percall': parts[2],
                        'cumtime': parts[3],
                        'filename': parts[4] + ' ' + parts[5]
                    })
                    
                    if len(functions) >= 10:
                        break
        
        return functions
    
    def _print_results(self):
        """Print performance gate results."""
        if not self._metrics:
            return
        
        print(f"\n{'='*70}")
        print("PERFORMANCE GATE RESULTS")
        print(f"{'='*70}")
        print(f"Total Time: {self._metrics.total_time_ms:.2f}ms (Limit: {self.max_latency_ms}ms)")
        print(f"Total Calls: {self._metrics.total_calls:,} (Limit: {self.max_function_calls:,})")
        print(f"Latency Gate: {'✓ PASS' if not self._metrics.latency_violation else '✗ FAIL'}")
        print(f"Call Limit Gate: {'✓ PASS' if not self._metrics.call_limit_violation else '✗ FAIL'}")
        
        if self._metrics.top_functions:
            print(f"\nTop 10 Functions:")
            for i, func in enumerate(self._metrics.top_functions[:5], 1):
                print(f"  {i}. {func['filename']}: {func['cumtime']}s")
        
        print(f"{'='*70}")
        
        if self.verbose and not (self._metrics.latency_violation or self._metrics.call_limit_violation):
            print("\n>>> SUCCESS: All performance gates passed")
    
    def print_report(self):
        """Alias for _print_results for backward compatibility."""
        self._print_results()
    
    @property
    def metrics(self) -> Optional[PerformanceMetrics]:
        """Access captured metrics."""
        return self._metrics


def profile_evolution_cycle():
    """
    Demo test function that exercises all PSR evolution phases.
    
    Use this function to validate the performance gate:
        >>> gate = PerformanceGate()
        >>> gate.evaluate(profile_evolution_cycle)
    """
    from .flux_node import FluxNode
    
    node = FluxNode("test-subject")
    
    # Trigger structural mutation
    for i in range(50):
        node.interact(i, "stress_test")
    
    # Trigger functional evolution
    node.interact("Context Shift", "calibration")
    
    # Trigger emergent behavior
    for _ in range(10):
        node.interact("Keep-Alive", "ping")
    
    if hasattr(node, 'rapid_channel'):
        node.rapid_channel()
    else:
        raise RuntimeError("Evolutionary Failure: Rapid channel did not manifest")


if __name__ == "__main__":
    # Run performance gate on demo function
    gate = PerformanceGate()
    gate.evaluate(profile_evolution_cycle)
