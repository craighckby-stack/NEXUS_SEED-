from typing import List, Protocol

class AbstractCodeAnalyzer(Protocol):
    """Defines the necessary interface for any code analysis dependency."""
    def read_file(self, path: str) -> str: ...
    def analyze_cc(self, code: str) -> float: ...
    def get_loc(self, code: str) -> int: ...
    def count_assertions(self, code: str) -> int: ...

class TestRigorEvaluator:
    """
    Calculates a composite Test Rigor Score (0.0 to 1.0) based on complexity and assertion density,
    decoupled from raw coverage metrics.
    """

    def __init__(self, analyzer: AbstractCodeAnalyzer):
        if not analyzer:
            raise ValueError("Analyzer dependency must be provided.")
        self._analyzer = analyzer

    def _calculate_complexity_score(self, test_source_code: str) -> float:
        """
        Calculates complexity ratio (CC / LOC) and normalizes it to a 'goodness' score (0.0 to 1.0).
        A higher score indicates a low/moderate CC/LOC ratio.
        """
        cc = self._analyzer.analyze_cc(test_source_code)
        loc = self._analyzer.get_loc(test_source_code)
        
        if loc <= 1:
            return 0.0

        # Complexity Ratio (CR): CC/LOC. Using a threshold of 0.5 for highly dense/complex tests.
        complexity_ratio = cc / loc
        
        # Map ratio to penalty. Penalize complexity_ratio exceeding the nominal acceptable bounds.
        # 1.0 means ideal/low complexity ratio; 0.0 means high complexity ratio (CR >= 0.5).
        normalized_complexity = min(1.0, complexity_ratio / 0.5)
        return 1.0 - normalized_complexity

    def _calculate_density_score(self, test_source_code: str) -> float:
        """
        Calculates assertion statements per line of test code and returns a normalized score (0.0 to 1.0).
        """
        total_asserts = self._analyzer.count_assertions(test_source_code)
        loc = self._analyzer.get_loc(test_source_code)

        if loc <= 1:
            return 0.0
        
        density_ratio = total_asserts / loc
        
        # Reward density up to a saturation point (e.g., 0.35 asserts/LOC).
        saturation_point = 0.35 
        
        density_score = min(1.0, density_ratio / saturation_point)
        return density_score

    def evaluate(self, affected_test_files: List[str]) -> float:
        """
        Evaluates the aggregate rigor score for a list of test files.
        """
        if not affected_test_files:
            return 0.0
            
        complexity_scores = []
        density_scores = []
        
        for path in affected_test_files:
            try:
                source = self._analyzer.read_file(path)
                
                complexity_scores.append(self._calculate_complexity_score(source))
                density_scores.append(self._calculate_density_score(source))
            
            except Exception as e:
                # In a robust system, this should use structured logging.
                # For now, simply skip the file on failure.
                continue

        if not complexity_scores:
            return 0.0

        avg_complexity_score = sum(complexity_scores) / len(complexity_scores)
        avg_density_score = sum(density_scores) / len(density_scores)
        
        # Final Rigor Score (Normalized 0.0-1.0).
        # Favor assertion density more heavily.
        # Note: avg_complexity_score already represents the positive contribution (lower CC is better).
        rigor_score = (avg_density_score * 0.7) + (avg_complexity_score * 0.3)
        
        return max(0.0, min(1.0, rigor_score))
