import os
import re
from typing import Protocol

# NOTE: This utility should ideally integrate with established tools like radon or lizard
# but provides a mock implementation based on regex parsing for immediate functionality.

class AbstractCodeAnalyzer(Protocol):
    def read_file(self, path: str) -> str: ...
    def analyze_cc(self, code: str) -> float: ...
    def get_loc(self, code: str) -> int: ...
    def count_assertions(self, code: str) -> int: ...


class CodeAnalyzerUtility:
    """A concrete implementation of AbstractCodeAnalyzer using basic IO and regex analysis."""

    def read_file(self, path: str) -> str:
        """Reads file content."""
        if not os.path.exists(path):
            # This error should ideally be caught by the evaluator caller, but fail fast here.
            raise FileNotFoundError(f"File not found: {path}")
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()

    def get_loc(self, code: str) -> int:
        """Calculates Lines of Code (excluding blank lines/comments)."""
        lines = code.split('\n')
        count = 0
        for line in lines:
            stripped = line.strip()
            if stripped and not stripped.startswith(('#', '//', '"""', "'''")):
                count += 1
        return count

    def count_assertions(self, code: str) -> int:
        """Counts common assertion keywords (assert, self.assertX, expect)."""
        # Use re.findall to catch all instances
        assert_pattern = re.compile(r'(\s|^)assert\s|\.assert[A-Z_a-z]+[\(]|\bexpect[\(]', re.MULTILINE)
        matches = assert_pattern.findall(code)
        return len(matches)

    def analyze_cc(self, code: str) -> float:
        """
        Simulated Cyclomatic Complexity calculation based on function/conditional keywords.
        This needs replacement with a dedicated library integration (e.g., radon/lizard).
        """
        # Markers that increase CC: if, for, while, except, def, elif, and, or
        cc_markers = re.findall(r'\b(if|for|while|except|def|elif|and|or)\b', code)
        
        # Base complexity (1) plus markers found
        simulated_cc = 1 + len(cc_markers)
        return float(simulated_cc)