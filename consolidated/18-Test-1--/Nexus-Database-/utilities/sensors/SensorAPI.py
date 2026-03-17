from abc import ABC, abstractmethod
from typing import Dict, Any, List
import time

class SensorAPI(ABC):
    """Abstract Base Class defining the contract for all system sensor implementations."""

    @abstractmethod
    def get_resource_metric(self, metric_key: str) -> Any:
        """Fetches a specific metric (e.g., 'cpu_utilization')."""
        pass

    @abstractmethod
    def get_all_resource_metrics(self) -> Dict[str, Any]:
        """Fetches a dictionary of all tracked resource metrics required by RTOM."""
        pass

class MockSensor(SensorAPI):
    """A mock implementation for testing and initialization purposes."""

    def __init__(self):
        self._mock_data = {
            'cpu_utilization': 0.05, # 5% load
            'memory_used_gb': 1.5,
            'disk_io_rate_mbps': 25.0,
            'thread_count': 12
        }

    def get_resource_metric(self, metric_key: str) -> Any:
        return self._mock_data.get(metric_key, None)

    def get_all_resource_metrics(self) -> Dict[str, Any]:
        # Simulate minor fluctuation/activity
        self._mock_data['cpu_utilization'] = min(0.99, self._mock_data['cpu_utilization'] + 0.01 * (time.time() % 1))
        self._mock_data['memory_used_gb'] = 1.5 + 0.1 * (time.time() % 1)
        
        return self._mock_data.copy()