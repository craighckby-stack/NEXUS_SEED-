from typing import Dict, Any, List, Protocol

class HistoryDBConnector(Protocol):
    """
    Contract for accessing historical execution data (Mandate P-M01 data source).
    Forces the dependency injection to adhere to expected behavior.
    """
    def query(self, sql: str, params: tuple) -> List[Dict[str, Any]]:
        """Executes a parameterized query and returns structured results."""
        ...

class ConfigManager(Protocol):
    """
    Contract for managing system configuration.
    """
    def get_config(self) -> Dict[str, Any]:
        """Retrieves the full system configuration."""
        ...
    def save_config(self, config: Dict[str, Any]) -> None:
        """Saves the modified configuration."""
        ...