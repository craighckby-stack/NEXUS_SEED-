from pathlib import Path
import re
from typing import Protocol, runtime_checkable

# NOTE: This utility should ideally integrate with established tools like radon or lizard
# but provides a mock implementation based on regex parsing for immediate functionality.

@runtime_checkable
class AbstractCodeAnalyzer(Protocol):
    def read_file(self, path: Path) -> str: ...
    def analyze_decision_points(self, code: str) -> float: ...
    def get_loc(self, code: str) -> int: ...
    def count_assertions(self, code: str) -> int: ...


class CodeAnalyzerUtility:
    """A concrete implementation of AbstractCodeAnalyzer using basic IO and regex analysis.
    Focuses on robust fundamental metrics useful for AGI self-improvement tracking.
    """

    def read_file(self, path: Path) -> str:
        """Reads file content robustly, handling basic IO and encoding errors.
        Accepts pathlib.Path object.
        """
        try:
            return path.read_text(encoding='utf-8')
        except FileNotFoundError as e:
            # Re-raise standard system error if the path doesn't exist
            raise e
        except Exception as e:
            # Catch potential encoding, permission, or other IO issues
            raise IOError(f"Error reading file {path}: {e}")

    def get_loc(self, code: str) -> int:
        """Calculates Non-Comment, Non-Blank Lines of Code (NCNB LOC), robustly
        excluding comments and multi-line docstrings using a basic state tracker.
        """
        lines = code.split('\n')
        count = 0
        in_docstring = False

        for line in lines:
            stripped = line.strip()

            if not stripped:
                continue

            # Check for docstring state transition
            if stripped.startswith('"""') or stripped.startswith("'''"):
                # If it's a single line docstring, we skip the line and continue.
                if (stripped.count('"""') >= 2 or stripped.count("'''") >= 2) and len(stripped) > 3:
                    continue
                
                # Toggle multi-line state
                in_docstring = not in_docstring
                continue

            if in_docstring or stripped.startswith('#'):
                continue
            
            count += 1
            
        return count

    def count_assertions(self, code: str) -> int:
        """Counts common assertion keywords (assert, self.assertX, expect), including raises as complexity indicators."""
        # Use re.findall to catch all instances, slightly expanding detection to include 'raise'
        assert_pattern = re.compile(
            r'\bassert\b|\.assert[A-Z_a-z]+[\(]|\bexpect[\(]|\braise\b',
            re.MULTILINE
        )
        matches = assert_pattern.findall(code)
        return len(matches)

    def analyze_decision_points(self, code: str) -> float:
        """
        Calculates Simulated Complexity based strictly on core control flow structures 
        (if, for, while, try, except, elif). This serves as a clearer proxy metric 
        than the original implementation.
        """
        # Markers that increase complexity: if, for, while, try, except, elif
        # Excludes logical operators ('and', 'or') and flow control ('return') for better complexity simulation.
        flow_markers = re.findall(
            r'\b(if|for|while|try|except|elif)\b',
            code
        )
        
        # Base complexity (1) plus markers found
        simulated_complexity = 1 + len(flow_markers)
        return float(simulated_complexity)
