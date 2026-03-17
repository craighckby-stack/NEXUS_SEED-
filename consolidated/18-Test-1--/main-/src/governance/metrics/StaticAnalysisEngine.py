from typing import Dict, Any, List
import ast

class StaticAnalysisEngine:
    """
    Concrete implementation of the AnalysisEngine protocol.
    Responsible for executing static analysis tools (e.g., Radon, custom AST parsers) 
    to extract raw, objective metrics for a given file content.
    """
    
    def __init__(self, tool_config: Dict[str, Any]):
        self.tool_config = tool_config

    def _run_radon_cc(self, file_content: str) -> List[Dict[str, Any]]:
        """Placeholder simulating external tool execution for cyclomatic complexity."""
        # Example: Real implementation runs subprocess or calls a Python library
        if "if __name__" in file_content:
            return [{"type": "module", "name": "module_level", "cc": 1}]
        if "def complex_func" in file_content:
            return [{"type": "function", "name": "complex_func", "cc": 8}]
        return []

    def _parse_dependencies(self, file_content: str) -> List[str]:
        """Custom implementation: Basic AST parsing for imports/dependencies."""
        try:
            tree = ast.parse(file_content)
            imports = [
                (node.names[0].name.split('.')[0] if isinstance(node, ast.Import) else node.module)
                for node in ast.walk(tree)
                if isinstance(node, (ast.Import, ast.ImportFrom))
            ]
            # Filter None/duplicates
            return sorted(list(set(filter(None, imports))))
        except Exception:
            return []

    def analyze_file(self, file_content: str) -> Dict[str, Any]:
        """
        Runs full static analysis on a single file content, collecting raw metrics.

        Returns: Raw metrics dictionary.
        """
        metrics = {}
        
        # Complexity Metrics
        if self.tool_config.get("complexity_tool") == "radon":
            metrics['cc_raw'] = self._run_radon_cc(file_content)
            
        # Coupling Metrics
        if self.tool_config.get("dependency_resolver") == "custom_import_graph":
            metrics['dependencies'] = self._parse_dependencies(file_content)
            
        # Basic LOC
        metrics['loc'] = len(file_content.split('\n'))
        
        return metrics
