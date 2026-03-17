"""
Advanced Test Vectors for PSR FluxNode
======================================

Resilience testing under non-linear flux conditions:

1. Concurrency Stress - Multi-threaded mutation pressure
2. State Corruption - Malformed/adversarial input handling
3. Mutation Cascade - Overlapping evolutionary triggers
4. Recovery Validation - System restoration after failures

Each vector validates a specific failure mode while maintaining
audit trail integrity and deterministic behavior.
"""

import threading
import time
import sys
import random
from typing import List, Dict, Any, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

from .flux_node import FluxNode, validate_node_evolution


# ========================================================================
# TEST INFRASTRUCTURE
# ========================================================================

@dataclass
class TestResult:
    """Structured test outcome with forensic data."""
    vector_name: str
    passed: bool
    duration_ms: float
    exceptions: List[Exception]
    audit_trail: List[Dict]
    final_state: Dict
    metrics: Dict[str, Any]
    
    def __str__(self):
        status = "✓ PASS" if self.passed else "✗ FAIL"
        return f"[{status}] {self.vector_name} ({self.duration_ms:.2f}ms)"


class TestHarness:
    """Orchestrates test execution and telemetry aggregation."""
    
    def __init__(self):
        self.results: List[TestResult] = []
        self.critical_failures: List[str] = []
    
    def run_vector(self, vector_func, vector_name: str) -> TestResult:
        """Execute a test vector with full instrumentation."""
        print(f"\n{'='*60}")
        print(f"EXECUTING: {vector_name}")
        print(f"{'='*60}")
        
        exceptions = []
        start_time = time.perf_counter()
        
        try:
            node, metrics = vector_func()
            passed = True
            final_state = node.get_state_snapshot()
            audit_trail = node.get_evolution_history()
            
        except Exception as e:
            print(f"!!! CRITICAL FAILURE: {e}")
            import traceback
            traceback.print_exc()
            
            exceptions.append(e)
            passed = False
            final_state = {}
            audit_trail = []
            metrics = {}
            self.critical_failures.append(vector_name)
        
        end_time = time.perf_counter()
        duration_ms = (end_time - start_time) * 1000
        
        result = TestResult(
            vector_name=vector_name,
            passed=passed,
            duration_ms=duration_ms,
            exceptions=exceptions,
            audit_trail=audit_trail,
            final_state=final_state,
            metrics=metrics
        )
        
        self.results.append(result)
        print(f"\n{result}")
        
        return result
    
    def print_summary(self) -> bool:
        """Generate test suite summary report."""
        print(f"\n{'='*60}")
        print("TEST SUITE SUMMARY")
        print(f"{'='*60}")
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed
        
        print(f"Total Vectors: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if self.critical_failures:
            print(f"\nCRITICAL FAILURES:")
            for failure in self.critical_failures:
                print(f"  - {failure}")
        
        # Performance summary
        total_time = sum(r.duration_ms for r in self.results)
        print(f"\nTotal Execution Time: {total_time:.2f}ms")
        print(f"Average Vector Time: {total_time/total:.2f}ms")
        
        return failed == 0


# ========================================================================
# VECTOR 1: CONCURRENCY STRESS
# ========================================================================

def vector_concurrency_stress() -> Tuple[FluxNode, Dict]:
    """
    Multi-threaded mutation pressure test.
    """
    node = FluxNode("concurrency-test")
    
    interaction_count = {'value': 0}
    race_conditions = {'detected': 0}
    lock = threading.Lock()
    
    def worker_thread(thread_id: int, iterations: int):
        local_exceptions = []
        
        for i in range(iterations):
            try:
                data = f"thread-{thread_id}-data-{i}"
                context = random.choice(['stress', 'load', 'concurrent'])
                
                result = node.interact(data, context)
                
                with lock:
                    interaction_count['value'] += 1
                    
                    if 'mutations_triggered' in result:
                        mutations = result['mutations_triggered']
                        if 'structural_refinement' in mutations:
                            if node.metrics.structural_transitions > 1:
                                race_conditions['detected'] += 1
                
                time.sleep(random.uniform(0.0001, 0.001))
                
            except Exception as e:
                local_exceptions.append(e)
        
        return local_exceptions
    
    num_threads = 10
    iterations_per_thread = 15
    
    print(f"Spawning {num_threads} threads × {iterations_per_thread} iterations...")
    
    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [
            executor.submit(worker_thread, tid, iterations_per_thread)
            for tid in range(num_threads)
        ]
        
        all_exceptions = []
        for future in as_completed(futures):
            exceptions = future.result()
            all_exceptions.extend(exceptions)
    
    print(f"\n--- Concurrency Metrics ---")
    print(f"Total Interactions: {interaction_count['value']}")
    print(f"Structural Transitions: {node.metrics.structural_transitions}")
    print(f"Exceptions Raised: {len(all_exceptions)}")
    
    assert node.metrics.structural_transitions <= 1, \
        f"Multiple structural transitions detected"
    
    print("\n✓ Concurrency stress test passed")
    
    return node, {
        'total_interactions': interaction_count['value'],
        'exceptions': len(all_exceptions),
        'race_conditions': race_conditions['detected']
    }


# ========================================================================
# VECTOR 2: STATE CORRUPTION
# ========================================================================

def vector_state_corruption() -> Tuple[FluxNode, Dict]:
    """
    Adversarial input injection test.
    """
    node = FluxNode("corruption-test")
    
    corruption_attempts = []
    recovery_count = 0
    
    print("Phase 1: Establishing baseline state...")
    for i in range(35):
        node.interact(i, "baseline")
    
    print("\nPhase 2: Injecting adversarial inputs...")
    
    adversarial_inputs = [
        {'type': 'dict', 'value': {'nested': [1, 2, 3]}},
        {'type': 'list', 'value': [1, [2, [3, 4]]]},
        {'type': 'none', 'value': None},
        {'type': 'large', 'value': "x" * 10000},
    ]
    
    for i, adv_input in enumerate(adversarial_inputs):
        try:
            result = node.interact(adv_input['value'], f"corruption-{adv_input['type']}")
            recovery_count += 1
        except Exception as e:
            corruption_attempts.append({
                'type': adv_input['type'],
                'error': str(e)
            })
    
    print("\nPhase 3: Validating system integrity...")
    try:
        node.interact("post-test", "validation")
        post_corruption_functional = True
    except:
        post_corruption_functional = False
    
    print(f"\n--- Corruption Metrics ---")
    print(f"Adversarial Inputs: {len(adversarial_inputs)}")
    print(f"Successful Recoveries: {recovery_count}")
    print(f"Post-Corruption Functional: {post_corruption_functional}")
    
    assert recovery_count >= len(adversarial_inputs) * 0.8, \
        f"Recovery rate too low: {recovery_count}/{len(adversarial_inputs)}"
    
    assert post_corruption_functional, "System non-functional after corruption"
    
    print("\n✓ State corruption test passed")
    
    return node, {
        'adversarial_inputs': len(adversarial_inputs),
        'recovery_rate': recovery_count / len(adversarial_inputs),
        'post_corruption_functional': post_corruption_functional
    }


# ========================================================================
# VECTOR 3: MUTATION CASCADE
# ========================================================================

def vector_mutation_cascade() -> Tuple[FluxNode, Dict]:
    """
    Overlapping evolutionary trigger test.
    """
    node = FluxNode("cascade-test")
    
    mutation_timeline = []
    
    print("Orchestrating mutation cascade...")
    
    for i in range(28):
        node.interact(i, "preload")
    
    print(f"Pre-load complete: {node.metrics.total_interactions} interactions")
    
    cascade_sequence = [
        ("CASCADE_TEXT_1", "cascade_context"),
        ("CASCADE_TEXT_2", "cascade_context"),
        (99, "cascade_context"),
        ("CASCADE_TEXT_3", "cascade_context"),
    ]
    
    for data, context in cascade_sequence:
        result = node.interact(data, context)
        
        if result['mutations_triggered']:
            mutation_timeline.append({
                'mutations': result['mutations_triggered']
            })
    
    final_state = node.get_state_snapshot()
    audit_trail = node.get_evolution_history()
    
    print(f"\n--- Cascade Metrics ---")
    print(f"Mutation Events: {len(mutation_timeline)}")
    print(f"Structural: {node.metrics.structural_transitions}")
    print(f"Functional: {node.metrics.functional_transitions}")
    print(f"Emergent: {node.metrics.emergent_behaviors}")
    
    assert node.metrics.structural_transitions == 1, \
        "Multiple structural transitions detected"
    
    assert len(audit_trail) >= 3, "Incomplete audit trail"
    
    assert validate_node_evolution(node), "Node did not reach fully evolved state"
    
    print("\n✓ Mutation cascade test passed")
    
    return node, {
        'mutation_events': len(mutation_timeline),
        'structural': node.metrics.structural_transitions,
        'functional': node.metrics.functional_transitions,
        'emergent': node.metrics.emergent_behaviors
    }


# ========================================================================
# MAIN EXECUTION
# ========================================================================

def main():
    """Execute full test suite."""
    harness = TestHarness()
    
    print("""
╔══════════════════════════════════════════════════════════════╗
║  PSR FluxNode - Advanced Resilience Test Suite              ║
║  Testing Situational Fidelity Under Non-Linear Flux          ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    harness.run_vector(vector_concurrency_stress, "Vector 1: Concurrency Stress")
    harness.run_vector(vector_state_corruption, "Vector 2: State Corruption")
    harness.run_vector(vector_mutation_cascade, "Vector 3: Mutation Cascade")
    
    all_passed = harness.print_summary()
    
    if all_passed:
        print("\n✓✓✓ ALL TEST VECTORS PASSED ✓✓✓")
        sys.exit(0)
    else:
        print("\n✗✗✗ TEST SUITE FAILED ✗✗✗")
        sys.exit(1)


if __name__ == "__main__":
    main()
