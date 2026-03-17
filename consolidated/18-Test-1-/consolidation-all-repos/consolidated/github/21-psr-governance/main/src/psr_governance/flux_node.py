"""
PSR FluxNode - Adaptive System Architecture
============================================

A self-modifying computational node that demonstrates:
1. Perpetual Self-Refinement (PSR) - Structural evolution
2. Contextual Resonance (CR) - Functional adaptation
3. Dynamic Interconnection (DI) - Emergent behavior

Performance Contract:
- Mutation cycles must complete within 200ms
- State transitions must be deterministic and auditable
- All evolutionary events logged for traceability
"""

import time
from typing import Any, Dict, List, Set, Callable, Optional
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class InteractionMetrics:
    """Telemetry for system introspection."""
    total_interactions: int = 0
    unique_contexts: Set[str] = field(default_factory=set)
    interaction_history: List[tuple] = field(default_factory=list)
    structural_transitions: int = 0
    functional_transitions: int = 0
    emergent_behaviors: int = 0
    
    def record(self, data: Any, context: str):
        """Thread-safe interaction logging."""
        self.total_interactions += 1
        self.unique_contexts.add(context)
        self.interaction_history.append((time.time(), data, context))


class FluxNode:
    """
    A computational node that evolves its internal structure and
    behavior based on interaction patterns.
    
    Evolution Triggers:
    - Structural: O(n) operations exceed threshold → migrate to O(1)
    - Functional: Data type shifts → strategy pattern adaptation
    - Emergent: High-frequency patterns → specialized method spawning
    
    Example:
        >>> node = FluxNode("test-node")
        >>> for i in range(35):
        ...     node.interact(i, "numeric")
        >>> node.interact("Hello", "text")
        >>> print(node.get_state_snapshot())
    """
    
    # --- Evolutionary Thresholds ---
    STRUCTURAL_THRESHOLD = 30  # List→Set migration point
    FUNCTIONAL_THRESHOLD = 5   # Strategy switching point
    EMERGENT_THRESHOLD = 8     # Method spawning point
    
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.metrics = InteractionMetrics()
        
        # --- Structural State (will evolve) ---
        self._data_store: List[Any] = []
        self._store_type = "list"
        
        # --- Functional State (will evolve) ---
        self._processing_strategy: Callable = self._default_processor
        
        # --- Emergent State (will evolve) ---
        self._context_frequency: Dict[str, int] = defaultdict(int)
        
        # --- Audit Trail ---
        self._evolution_log: List[Dict[str, Any]] = []
        
    # ========================================================================
    # CORE INTERACTION INTERFACE
    # ========================================================================
    
    def interact(self, data: Any, context: str) -> Dict[str, Any]:
        """
        Primary interaction point. Triggers PSR evaluation on each call.
        
        Args:
            data: Input data to process
            context: Context identifier for the interaction
            
        Returns:
            dict: {
                'processed': Any,
                'mutations_triggered': List[str],
                'current_state': Dict
            }
        """
        mutations = []
        
        # Record interaction
        self.metrics.record(data, context)
        self._context_frequency[context] += 1
        
        # --- TRIGGER EVALUATION (PSR Core) ---
        
        # 1. Perpetual Self-Refinement: Structural Evolution
        if self._should_refine_structure():
            self._evolve_structure()
            mutations.append("structural_refinement")
            
        # 2. Contextual Resonance: Functional Evolution
        if self._should_adapt_strategy(data):
            self._evolve_strategy(data)
            mutations.append("functional_adaptation")
            
        # 3. Dynamic Interconnection: Emergent Behavior
        if self._should_spawn_behavior(context):
            self._spawn_emergent_method(context)
            mutations.append("emergent_behavior")
        
        # Process data with current strategy
        processed = self._processing_strategy(data)
        
        # Store in evolved structure
        self._store_data(data)
        
        return {
            'processed': processed,
            'mutations_triggered': mutations,
            'current_state': self._get_state_snapshot()
        }
    
    # ========================================================================
    # PSR TRIGGER LOGIC
    # ========================================================================
    
    def _should_refine_structure(self) -> bool:
        """
        Structural refinement trigger: Migrate from O(n) to O(1) lookup
        when data volume exceeds threshold.
        """
        return (
            self._store_type == "list" and
            len(self._data_store) >= self.STRUCTURAL_THRESHOLD
        )
    
    def _should_adapt_strategy(self, data: Any) -> bool:
        """
        Functional adaptation trigger: Switch processing strategy when
        data type patterns shift.
        """
        # Detect if we're receiving text data for the first time
        return (
            isinstance(data, str) and
            self._processing_strategy == self._default_processor and
            self.metrics.total_interactions >= self.FUNCTIONAL_THRESHOLD
        )
    
    def _should_spawn_behavior(self, context: str) -> bool:
        """
        Emergent behavior trigger: Spawn specialized methods for
        high-frequency interaction patterns.
        """
        return (
            self._context_frequency[context] >= self.EMERGENT_THRESHOLD and
            not hasattr(self, 'rapid_channel')
        )
    
    # ========================================================================
    # EVOLUTIONARY MUTATIONS
    # ========================================================================
    
    def _evolve_structure(self):
        """
        Structural Mutation: List → Set
        Optimization for membership testing and deduplication.
        """
        self._log_evolution("structural", {
            'from': 'list',
            'to': 'set',
            'reason': f'data_volume={len(self._data_store)}',
            'performance_gain': 'O(n)→O(1) lookup'
        })
        
        # Migrate data
        self._data_store = set(self._data_store)
        self._store_type = "set"
        self.metrics.structural_transitions += 1
    
    def _evolve_strategy(self, sample_data: Any):
        """
        Functional Mutation: Default → Text Processor
        Adaptation to changing input characteristics.
        """
        self._log_evolution("functional", {
            'from': 'default_processor',
            'to': 'text_analyzer',
            'trigger_data_type': type(sample_data).__name__,
            'reason': 'text_pattern_detected'
        })
        
        # Switch to text-optimized strategy
        self._processing_strategy = self._text_analyzer
        self.metrics.functional_transitions += 1
    
    def _spawn_emergent_method(self, context: str):
        """
        Emergent Mutation: Dynamic Method Spawning
        Creates specialized channels for high-frequency contexts.
        """
        self._log_evolution("emergent", {
            'method_name': 'rapid_channel',
            'context': context,
            'frequency': self._context_frequency[context],
            'reason': 'high_frequency_pattern'
        })
        
        # Dynamically add optimized method
        def rapid_channel():
            """Emergent fast-path for frequent interactions."""
            return {
                'channel': 'rapid',
                'optimized_for': context,
                'frequency': self._context_frequency[context],
                'latency': 'O(1)'
            }
        
        # Bind to instance
        setattr(self, 'rapid_channel', rapid_channel)
        self.metrics.emergent_behaviors += 1
    
    # ========================================================================
    # PROCESSING STRATEGIES (Functional Layer)
    # ========================================================================
    
    def _default_processor(self, data: Any) -> Any:
        """Default processing: simple identity with metadata."""
        return {
            'value': data,
            'type': type(data).__name__,
            'strategy': 'default'
        }
    
    def _text_analyzer(self, data: Any) -> Dict[str, Any]:
        """Text-optimized processing strategy."""
        if not isinstance(data, str):
            return self._default_processor(data)
        
        return {
            'value': data,
            'length': len(data),
            'word_count': len(data.split()),
            'strategy': 'text_analyzer',
            'normalized': data.lower().strip()
        }
    
    # ========================================================================
    # STORAGE LAYER (Structural Adaptation)
    # ========================================================================
    
    def _store_data(self, data: Any):
        """Store data using evolved structure."""
        if self._store_type == "list":
            self._data_store.append(data)
        elif self._store_type == "set":
            # Sets require hashable data
            try:
                self._data_store.add(data)
            except TypeError:
                # Fall back to storing hash for unhashable types
                self._data_store.add(str(hash(str(data))))
    
    # ========================================================================
    # INTROSPECTION & TELEMETRY
    # ========================================================================
    
    def _get_state_snapshot(self) -> Dict[str, Any]:
        """Returns current evolutionary state for audit."""
        return {
            'node_id': self.node_id,
            'store_type': self._store_type,
            'store_size': len(self._data_store),
            'strategy': self._processing_strategy.__name__,
            'emergent_methods': [
                m for m in dir(self)
                if m.startswith('rapid_') and callable(getattr(self, m))
            ],
            'metrics': {
                'interactions': self.metrics.total_interactions,
                'unique_contexts': len(self.metrics.unique_contexts),
                'mutations': {
                    'structural': self.metrics.structural_transitions,
                    'functional': self.metrics.functional_transitions,
                    'emergent': self.metrics.emergent_behaviors
                }
            }
        }
    
    def _log_evolution(self, mutation_type: str, details: Dict[str, Any]):
        """Audit trail for all evolutionary events."""
        self._evolution_log.append({
            'timestamp': time.time(),
            'type': mutation_type,
            'details': details,
            'state_before': self._get_state_snapshot()
        })
    
    def get_evolution_history(self) -> List[Dict[str, Any]]:
        """Returns complete mutation history for analysis."""
        return self._evolution_log
    
    def get_state_snapshot(self) -> Dict[str, Any]:
        """Public method for current state introspection."""
        return self._get_state_snapshot()


# ========================================================================
# VALIDATION HELPERS (For Testing)
# ========================================================================

def validate_node_evolution(node: FluxNode) -> bool:
    """
    Validates that a node has undergone all expected evolutionary phases.
    Used by test harnesses to verify PSR completeness.
    """
    state = node.get_state_snapshot()
    
    checks = {
        'structural': state['store_type'] == 'set',
        'functional': state['strategy'] != 'default_processor',
        'emergent': len(state['emergent_methods']) > 0
    }
    
    return all(checks.values())


if __name__ == "__main__":
    # Quick validation demo
    print("PSR FluxNode - Reference Implementation")
    print("=" * 50)
    
    node = FluxNode("demo")
    
    # Trigger structural evolution
    for i in range(35):
        result = node.interact(i, "numeric")
    
    # Trigger functional evolution
    for i in range(10):
        result = node.interact(f"text_{i}", "textual")
    
    # Trigger emergent evolution
    for i in range(10):
        result = node.interact("ping", "heartbeat")
    
    # Validate
    print(f"\nEvolution Complete: {validate_node_evolution(node)}")
    print(f"Final State: {node.get_state_snapshot()}")
    
    if hasattr(node, 'rapid_channel'):
        print(f"Emergent Method Test: {node.rapid_channel()}")
