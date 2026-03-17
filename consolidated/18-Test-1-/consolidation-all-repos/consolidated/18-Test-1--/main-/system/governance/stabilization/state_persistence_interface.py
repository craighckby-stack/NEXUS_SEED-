# Purpose: Defines the interface for persisting MHVA stabilization state across restarts.
# The current MetricsVettingAgent stores history only in memory (volatile).
# To achieve true system stabilization and fault tolerance, the history of recent signals must be persisted.

from typing import Dict, Deque, Any

class StabilityPersistenceInterface:
    """Abstract interface for storing and retrieving Vetting Agent history."""

    def load_history(self, metric_key: str) -> Deque[Any]:
        """Loads the history deque for a specific metric key."""
        raise NotImplementedError("Subclasses must implement load_history")

    def save_history(self, metric_key: str, history_deque: Deque[Any]):
        """Saves the current history deque for a specific metric key."""
        raise NotImplementedError("Subclasses must implement save_history")

    def initialize_storage(self):
        """Ensures persistence layer (e.g., Redis connection, database, file system) is ready."""
        pass

# NOTE: The MetricsVettingAgent should be updated to accept and utilize an instance of 
# StabilityPersistenceInterface in its __init__ to enable state persistence.