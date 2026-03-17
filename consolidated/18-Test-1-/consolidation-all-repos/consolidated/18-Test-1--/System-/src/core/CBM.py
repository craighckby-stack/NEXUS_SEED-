from typing import Dict, Any, Union, TypedDict, cast, List, Optional
import math

# --- Type Definitions ---

class ComplexityMetrics(TypedDict):
    """The measurable complexity metrics (Turing Signature) of an analysis.
    These metrics are derived from static structural features.
    """
    size_bytes: int
    depth_heuristic: int
    turing_score: float

class ComputationalLimits(TypedDict, total=False):
    """Defines the structural and resource constraints imposed by CBM.
    These act as hard ceilings for proposed state transitions.
    """
    max_size_bytes: int
    max_depth_heuristic: int
    turing_budget: float

SSTManifest = Dict[str, Any] # System State Transition Manifest (generic payload)

class CBMVeto(Exception):
    """Custom exception raised when CBM constraints are violated.
    This signals an immediate rejection of the proposed SST.
    """
    pass

class ComputationalBoundednessModule:
    """
    L2: CBM performs static analysis to ensure the proposed SST (System State Transition) 
    is computationally bounded (S-02 risk mitigation, preventing accidental O(n^k) scaling).

    CBM relies solely on structural features available pre-execution.
    """

    # Maps ComplexityMetrics keys -> ComputationalLimits keys
    METRIC_LIMIT_MAP: Dict[str, str] = {
        "size_bytes": "max_size_bytes",
        "depth_heuristic": "max_depth_heuristic",
        "turing_score": "turing_budget"
    }

    def __init__(self, limits: ComputationalLimits):
        """
        Initializes CBM with structural and resource constraints.
        Ensures limits are valid non-negative numeric values.
        """
        if not limits:
            raise ValueError("CBM initialization requires non-empty resource limits.")

        self.limits: ComputationalLimits = {}
        for k, v in limits.items():
            if isinstance(v, (int, float)):
                if v < 0:
                    raise ValueError(f"Limit '{k}' must be non-negative, got {v}.")
                # Store validated limit
                self.limits[k] = v

        if not self.limits:
             raise ValueError("No valid numeric resource limits were provided after validation.")

    def _calculate_size_proxy(self, data: SSTManifest) -> int:
        """Estimates the structural size proxy using repr() and UTF-8 encoding.
        Used as a proxy for serialization and processing cost.
        """
        try:
            return len(repr(data).encode('utf-8'))
        except TypeError:
            return 0

    def _calculate_depth_heuristic(self, data: SSTManifest) -> int:
        """Estimates potential recursion or chaining depth from metadata.
        Ensures a minimum depth of 1 for scoring.
        """
        try:
            # Defaulting to 1 for minimal non-zero depth
            depth = int(data.get('metadata', {}).get('depth_hint', 1))
            return max(1, depth)
        except (ValueError, TypeError):
            return 1 # Fallback depth

    def calculate_metrics(self, sst_manifest: SSTManifest) -> ComplexityMetrics:
        """
        Estimates the static computational complexity based on structural features. 
        Returns the Complexity Metrics signature.
        """
        
        size_bytes = self._calculate_size_proxy(sst_manifest)
        depth_heuristic = self._calculate_depth_heuristic(sst_manifest)
        
        # 3. Overall Turing Score (Normalized static metric)
        # Uses log size * depth * scaling factor.
        log_size = math.log(size_bytes + 1, 10) # +1 prevents log(0)
        turing_score = log_size * depth_heuristic * 0.1 # Retaining original scaling factor 0.1
        
        signature: ComplexityMetrics = {
            "size_bytes": size_bytes,
            "depth_heuristic": depth_heuristic,
            "turing_score": turing_score
        }
        return signature

    def bounds_check(self, sst_manifest: SSTManifest) -> bool:
        """
        Performs static constraint checking against the predefined CBM ceilings.
        Raises CBMVeto if the bounds are violated.
        """
        metrics = self.calculate_metrics(sst_manifest)
        violations: List[str] = []

        for metric_name, value in metrics.items():
            limit_key = self.METRIC_LIMIT_MAP.get(metric_name)
            
            if limit_key and limit_key in self.limits:
                limit = self.limits[limit_key]
                
                # Comparison must handle potential float types for scores/budgets
                if value > cast(float, limit):
                    violations.append(
                        f"Metric '{metric_name}' (V: {value:,.2f}) > Limit '{limit_key}' (L: {limit:,.2f})"
                    )
        
        if violations:
            violation_str = "; ".join(violations)
            reason = (
                f"CBM VETO (S-02 risk mitigation): Static signature violation(s) detected: "
                f"[{violation_str}]"
            )
            raise CBMVeto(reason)
        
        return True
