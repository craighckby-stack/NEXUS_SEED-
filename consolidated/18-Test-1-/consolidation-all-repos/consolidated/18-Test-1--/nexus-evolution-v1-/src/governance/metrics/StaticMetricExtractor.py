from typing import Dict, Any, List, TypedDict, Optional, Protocol, runtime_checkable

# --- Type Definitions for enhanced clarity ---

class StaticExtractorConfig(TypedDict):
    complexity_tool: str
    dependency_resolver: str
    cc_weight: float
    coupling_weight: float


class StaticMetricsDelta(TypedDict):
    """Standardized output structure for delta metrics (change relative to baseline)."""
    cyclomatic_complexity_delta: Optional[float]
    maintainability_index_delta: Optional[float]
    coupling_score_delta: Optional[float]
    files_analyzed: int
    lines_of_code_change: int # Added context metric

# --- Protocol for analysis components (Anticipatory Design) ---
@runtime_checkable
class AnalysisEngine(Protocol):
    """Protocol defining the interface for a static analysis tool wrapper, facilitating dependency injection."""
    def analyze_file(self, file_content: str) -> Dict[str, Any]:
        """Runs full analysis on a single file content, returning raw metrics."""
        ...
    
# --- Extractor Class ---

class StaticMetricExtractor:
    """
    Utility class dedicated to performing static code analysis on code deltas 
    to extract objective complexity and dependency metrics required by the CEE.
    
    It consumes raw metrics (via the injected AnalysisEngine) and calculates relative 
    change (delta) against a structural baseline.
    """
    
    DEFAULT_CONFIG: StaticExtractorConfig = {
        "complexity_tool": "radon",
        "dependency_resolver": "custom_import_graph",
        "cc_weight": 0.6,
        "coupling_weight": 0.4
    }

    def __init__(self, config: Dict[str, Any], analysis_engine: Optional['AnalysisEngine'] = None):
        # Explicitly use the TypedDict for config and accept dependency injection
        self.config: StaticExtractorConfig = {**self.DEFAULT_CONFIG, **config}
        self._engine: Optional[AnalysisEngine] = analysis_engine

        if self._engine is None:
             # Note: In a production environment, this should initialize or fail robustly.
             print("Warning: StaticMetricExtractor initialized without a concrete AnalysisEngine.")

    def _calculate_complexity_metrics(self, delta_files: List[Dict[str, Any]], baseline: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculates the delta for CC and MI by analyzing change in structure.
        Relies on raw metrics derived from the AnalysisEngine.
        """
        # Placeholder logic: Requires complex comparison of pre/post metrics
        cc_delta = 2.2 
        mi_delta = cc_delta * -0.5 # A placeholder correlation
        
        return {
            "cyclomatic_complexity_delta": cc_delta,
            "maintainability_index_delta": mi_delta
        }

    def _calculate_coupling_delta(self, delta_files: List[Dict[str, Any]], baseline: Dict[str, Any]) -> float:
        """Stub for calculating change in normalized dependency coupling score."""
        # Placeholder implementation details hidden
        return 0.15 

    def _calculate_loc_change(self, delta_files: List[Dict[str, Any]]) -> int:
        """Determines the total estimated change in lines of code (essential for MI context)."""
        # Placeholder implementation
        return 45 

    def analyze_delta(self, delta_files: List[Dict[str, Any]], structural_baseline: Dict[str, Any]) -> StaticMetricsDelta:
        """
        Analyzes the proposed changes to quantify intrinsic complexity and coupling metrics.

        Args:
            delta_files: List of file representations (path, content, status).
            structural_baseline: Snapshot of the metrics before the change.

        Returns: The standardized delta metrics structure.
        """
        if not delta_files:
            return StaticMetricsDelta(
                cyclomatic_complexity_delta=0.0,
                maintainability_index_delta=0.0,
                coupling_score_delta=0.0,
                files_analyzed=0,
                lines_of_code_change=0
            )

        complexity_metrics = self._calculate_complexity_metrics(delta_files, structural_baseline)
        coupling_delta = self._calculate_coupling_delta(delta_files, structural_baseline)
        loc_change = self._calculate_loc_change(delta_files)

        return StaticMetricsDelta(
            cyclomatic_complexity_delta=complexity_metrics["cyclomatic_complexity_delta"],
            maintainability_index_delta=complexity_metrics["maintainability_index_delta"],
            coupling_score_delta=coupling_delta,
            files_analyzed=len(delta_files),
            lines_of_code_change=loc_change
        )
