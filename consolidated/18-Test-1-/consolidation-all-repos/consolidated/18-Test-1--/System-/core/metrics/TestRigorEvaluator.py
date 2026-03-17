class TestRigorEvaluator:
    """Calculates a composite Test Rigor Score (0.0 to 1.0) based on test complexity and assertion density, not just coverage."""

    def __init__(self, analysis_tool='lizard'):
        # Initialize complexity analysis tool (placeholder)
        self.tool = analysis_tool

    def _calculate_complexity_ratio(self, test_source_code):
        # Simulate calculation of metrics like Cyclomatic Complexity relative to test size
        complexity = self.tool.analyze_cc(test_source_code)
        loc = self.tool.get_loc(test_source_code)
        return complexity / max(1, loc) if loc > 0 else 0

    def _analyze_assertion_density(self, test_source_code):
        # Simulate calculation of assertion statements per line of test code
        total_asserts = self.tool.count_assertions(test_source_code)
        loc = self.tool.get_loc(test_source_code)
        return total_asserts / max(1, loc) if loc > 0 else 0

    def evaluate(self, affected_test_files: list) -> float:
        if not affected_test_files:
            return 0.0
            
        total_complexity_ratio = 0
        total_density = 0
        
        for path in affected_test_files:
            source = self.tool.read_file(path)
            total_complexity_ratio += self._calculate_complexity_ratio(source)
            total_density += self._analyze_assertion_density(source)

        avg_complexity = total_complexity_ratio / len(affected_test_files)
        avg_density = total_density / len(affected_test_files)
        
        # Rigor Score = (Density is positive weight) + (Complexity (inverted) is negative weight)
        # Normalization and weighting required for robust results.
        rigor_score = (avg_density * 0.6) + ((1 - min(1.0, avg_complexity)) * 0.4)
        
        return max(0.0, min(1.0, rigor_score))
