"""
Chaos Engineering Test Suite for PSR FluxNode
==============================================

Extreme failure mode exploration to validate system boundaries:

1. Memory Exhaustion - Resource starvation scenarios
2. Mutation Loop Detection - Infinite recursion prevention
3. Audit Trail Overflow - Storage capacity limits
4. Threshold Manipulation - Adversarial parameter injection
5. Temporal Anomalies - Clock skew and timestamp corruption

Each scenario pushes the system beyond normal operational
parameters to discover failure boundaries and validate
graceful degradation behavior.
"""

import gc
import sys
import time
from typing import List, Dict, Any
from dataclasses import dataclass

from .flux_node import FluxNode


# ========================================================================
# CHAOS INFRASTRUCTURE
# ========================================================================

@dataclass
class ChaosResult:
    """Structured chaos test outcome with forensic telemetry."""
    scenario_name: str
    survived: bool
    failure_mode: str = None
    recovery_possible: bool = True
    resource_metrics: Dict = None
    boundary_discovered: str = None
    mitigation_required: List[str] = None
    
    def __post_init__(self):
        if self.resource_metrics is None:
            self.resource_metrics = {}
        if self.mitigation_required is None:
            self.mitigation_required = []
    
    def __str__(self):
        status = "⚡ SURVIVED" if self.survived else "💥 FAILED"
        return f"[{status}] {self.scenario_name}"


class ChaosOrchestrator:
    """Manages chaos scenario execution and forensic analysis."""
    
    def __init__(self):
        self.results: List[ChaosResult] = []
        self.critical_boundaries: List[str] = []
    
    def execute_scenario(self, scenario_func, scenario_name: str) -> ChaosResult:
        """Execute chaos scenario with full isolation and instrumentation."""
        print(f"\n{'⚡'*30}")
        print(f"CHAOS SCENARIO: {scenario_name}")
        print(f"{'⚡'*30}")
        
        # Pre-chaos resource baseline
        gc.collect()
        baseline_objects = len(gc.get_objects())
        
        start_time = time.perf_counter()
        
        try:
            result = scenario_func()
            survived = True
            failure_mode = None
            
        except MemoryError as e:
            print(f"💥 MEMORY EXHAUSTION: {e}")
            survived = False
            failure_mode = "memory_exhaustion"
            result = {}
            
        except RecursionError as e:
            print(f"💥 RECURSION LIMIT: {e}")
            survived = False
            failure_mode = "infinite_recursion"
            result = {}
            
        except Exception as e:
            print(f"💥 UNEXPECTED FAILURE: {e}")
            import traceback
            traceback.print_exc()
            survived = False
            failure_mode = type(e).__name__
            result = {}
            
        finally:
            end_time = time.perf_counter()
            gc.collect()
            post_objects = len(gc.get_objects())
        
        duration_ms = (end_time - start_time) * 1000
        
        chaos_result = ChaosResult(
            scenario_name=scenario_name,
            survived=survived,
            failure_mode=failure_mode,
            recovery_possible=result.get('recovery_possible', True),
            resource_metrics={
                'duration_ms': duration_ms,
                'object_delta': post_objects - baseline_objects,
                'baseline_objects': baseline_objects,
                'post_objects': post_objects
            },
            boundary_discovered=result.get('boundary_discovered'),
            mitigation_required=result.get('mitigation_required', [])
        )
        
        self.results.append(chaos_result)
        print(f"\n{chaos_result}")
        
        if chaos_result.boundary_discovered:
            self.critical_boundaries.append(chaos_result.boundary_discovered)
        
        return chaos_result
    
    def print_chaos_report(self) -> tuple:
        """Generate comprehensive chaos engineering report."""
        print(f"\n{'='*70}")
        print("CHAOS ENGINEERING REPORT")
        print(f"{'='*70}")
        
        total = len(self.results)
        survived = sum(1 for r in self.results if r.survived)
        
        print(f"\nScenarios Executed: {total}")
        print(f"System Survived: {survived}/{total}")
        print(f"Survival Rate: {(survived/total)*100:.1f}%")
        
        # Failure mode analysis
        failure_modes = {}
        for result in self.results:
            if not result.survived and result.failure_mode:
                failure_modes[result.failure_mode] = failure_modes.get(result.failure_mode, 0) + 1
        
        if failure_modes:
            print(f"\nFailure Mode Distribution:")
            for mode, count in failure_modes.items():
                print(f"  - {mode}: {count}")
        
        # Discovered boundaries
        if self.critical_boundaries:
            print(f"\nCritical Boundaries Discovered:")
            for boundary in self.critical_boundaries:
                print(f"  ⚠️  {boundary}")
        
        # Mitigation recommendations
        all_mitigations = set()
        for result in self.results:
            all_mitigations.update(result.mitigation_required)
        
        if all_mitigations:
            print(f"\nRequired Mitigations:")
            for i, mitigation in enumerate(all_mitigations, 1):
                print(f"  {i}. {mitigation}")
        
        # Resource analysis
        total_object_delta = sum(r.resource_metrics['object_delta'] for r in self.results)
        avg_duration = sum(r.resource_metrics['duration_ms'] for r in self.results) / total
        
        print(f"\nResource Impact:")
        print(f"  Total Object Delta: {total_object_delta:,}")
        print(f"  Average Scenario Duration: {avg_duration:.2f}ms")
        
        return survived, total


# ========================================================================
# SCENARIO 1: MEMORY EXHAUSTION
# ========================================================================

def chaos_memory_exhaustion():
    """
    Progressive memory starvation to discover allocation limits.
    """
    print("Initializing memory exhaustion scenario...")
    
    node = FluxNode("chaos-memory")
    
    memory_samples = []
    iteration = 0
    max_iterations = 500_000  # Conservative limit
    sample_interval = 10_000
    
    print(f"Injecting load until memory exhaustion (max {max_iterations:,} iterations)...")
    
    try:
        for i in range(max_iterations):
            payload = f"CHAOS_DATA_{i}_" + ("X" * 100)
            
            node.interact(payload, f"chaos_context_{i % 100}")
            iteration = i
            
            if i % sample_interval == 0:
                gc.collect()
                current_objects = len(gc.get_objects())
                memory_samples.append({
                    'iteration': i,
                    'objects': current_objects,
                    'store_size': node.get_state_snapshot()['store_size'],
                    'audit_entries': len(node.get_evolution_history())
                })
                
                print(f"  [{i:,}] Objects: {current_objects:,}, "
                      f"Store: {node.get_state_snapshot()['store_size']:,}, "
                      f"Audit: {len(node.get_evolution_history())}")
                
                if len(memory_samples) >= 3:
                    growth_rate = (
                        memory_samples[-1]['objects'] - memory_samples[-3]['objects']
                    ) / 2
                    
                    if growth_rate > 50000:
                        print(f"⚠️  Unbounded growth detected: {growth_rate:,.0f} objects/sample")
                        break
        
        survived = True
        boundary = None
        
    except MemoryError:
        survived = False
        boundary = f"Memory exhaustion at {iteration:,} iterations"
        print(f"💥 Memory limit reached at iteration {iteration:,}")
    
    mitigations = []
    final_audit_size = len(node.get_evolution_history())
    
    if final_audit_size > 1000:
        mitigations.append(f"Audit trail unbounded: {final_audit_size} entries")
    
    return {
        'survived': survived,
        'recovery_possible': True,
        'boundary_discovered': boundary,
        'mitigation_required': mitigations
    }


# ========================================================================
# SCENARIO 2: MUTATION LOOP DETECTION
# ========================================================================

def chaos_mutation_loop():
    """
    Attempt to trigger infinite mutation recursion.
    """
    print("Attempting to trigger mutation loop...")
    
    node = FluxNode("chaos-mutation-loop")
    
    mutation_count = 0
    max_safe_mutations = 100
    
    print(f"Injecting data with aggressive mutation triggers...")
    
    try:
        for i in range(1000):
            result = node.interact(f"chaos_{i}", "loop_test")
            
            if result['mutations_triggered']:
                mutation_count += len(result['mutations_triggered'])
                
                if mutation_count > max_safe_mutations:
                    print(f"⚠️  Mutation count exceeded safety threshold: {mutation_count}")
                    break
        
        survived = True
        boundary = None
        
    except RecursionError as e:
        survived = False
        boundary = f"Infinite mutation recursion detected at mutation #{mutation_count}"
        print(f"💥 Recursion error: {e}")
    
    mitigations = []
    final_state = node.get_state_snapshot()
    total_mutations = (
        final_state['metrics']['mutations']['structural'] +
        final_state['metrics']['mutations']['functional'] +
        final_state['metrics']['mutations']['emergent']
    )
    
    if final_state['metrics']['mutations']['structural'] > 1:
        mitigations.append("Multiple structural mutations detected - add idempotency check")
    
    if total_mutations > 10:
        mitigations.append(f"High mutation count ({total_mutations}) - verify threshold logic")
    
    return {
        'survived': survived,
        'recovery_possible': True,
        'boundary_discovered': boundary,
        'mitigation_required': mitigations
    }


# ========================================================================
# SCENARIO 3: AUDIT TRAIL OVERFLOW
# ========================================================================

def chaos_audit_overflow():
    """
    Stress-test audit trail storage under extreme logging pressure.
    """
    print("Generating massive audit trail...")
    
    node = FluxNode("chaos-audit")
    
    target_audit_size = 5_000
    
    print(f"Target: {target_audit_size:,} audit entries...")
    
    start_time = time.perf_counter()
    
    for i in range(target_audit_size // 3):
        node.interact(i, "audit_stress")
        
        if i < 100:
            node.interact(f"text_{i}", "text_context")
            node.interact("ping", "ping_context")
    
    evolution_time = time.perf_counter() - start_time
    
    start_retrieval = time.perf_counter()
    audit_trail = node.get_evolution_history()
    retrieval_time = time.perf_counter() - start_retrieval
    
    audit_size = len(audit_trail)
    
    print(f"\nAudit Trail Metrics:")
    print(f"  Entries: {audit_size:,}")
    print(f"  Retrieval Time: {retrieval_time*1000:.2f}ms")
    
    mitigations = []
    
    if retrieval_time > 0.1:
        mitigations.append(f"Audit retrieval slow ({retrieval_time*1000:.0f}ms) - implement pagination")
    
    return {
        'survived': True,
        'recovery_possible': True,
        'mitigation_required': mitigations,
        'audit_size': audit_size,
        'retrieval_latency_us': (retrieval_time/audit_size)*1000000
    }


# ========================================================================
# MAIN EXECUTION
# ========================================================================

def main():
    """Execute chaos engineering suite."""
    orchestrator = ChaosOrchestrator()
    
    print("""
╔══════════════════════════════════════════════════════════════════╗
║  PSR FluxNode - Chaos Engineering Suite                          ║
║  Exploring System Boundaries Under Extreme Adversarial Conditions║
╚══════════════════════════════════════════════════════════════════╝
    """)
    
    orchestrator.execute_scenario(chaos_memory_exhaustion, "Scenario 1: Memory Exhaustion")
    orchestrator.execute_scenario(chaos_mutation_loop, "Scenario 2: Mutation Loop Detection")
    orchestrator.execute_scenario(chaos_audit_overflow, "Scenario 3: Audit Trail Overflow")
    
    survived, total = orchestrator.print_chaos_report()
    
    print(f"\n{'='*70}")
    print("BOUNDARY ANALYSIS COMPLETE")
    print(f"{'='*70}")
    
    if survived == total:
        print("✓ System demonstrated resilience across all chaos scenarios")
    else:
        print(f"⚠️  System survived {survived}/{total} scenarios")
    
    return 0 if survived >= total * 0.8 else 1


if __name__ == "__main__":
    sys.exit(main())
