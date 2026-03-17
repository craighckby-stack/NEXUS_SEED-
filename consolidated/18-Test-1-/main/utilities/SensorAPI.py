"""
Abstract Sensor API for System Monitoring

Defines the required interface for low-level system metric providers. This ensures 
RTOM is testable and platform-independent by enforcing a strict data retrieval contract.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any

class SensorAPI(ABC):
    """Base class defining the contract for retrieving instantaneous resource telemetry.
    RTOM requires adherence to this interface.
    """

    @abstractmethod
    def get_cpu_metrics(self) -> Dict[str, float]:
        """Returns instantaneous CPU utilization (e.g., core usage, load averages)."""
        pass

    @abstractmethod
    def get_memory_metrics(self) -> Dict[str, float]:
        """Returns current physical and virtual memory usage."""
        pass

    @abstractmethod
    def get_io_metrics(self) -> Dict[str, float]:
        """Returns Disk I/O metrics (IOPS, throughput)."""
        pass

    @abstractmethod
    def get_network_metrics(self) -> Dict[str, float]:
        """Returns Network latency and throughput metrics."""
        pass
        
    def get_all_resource_metrics(self) -> Dict[str, Any]:
        """Aggregates all specific resource metrics for RTOM ingestion."""
        return {
            'cpu': self.get_cpu_metrics(),
            'memory': self.get_memory_metrics(),
            'io': self.get_io_metrics(),
            'network': self.get_network_metrics(),
        }

class MockSensor(SensorAPI):
    """Default implementation used when no concrete OS/Hypervisor API is provided."""
    
    def get_cpu_metrics(self) -> Dict[str, float]:
        return {'utilization_percent': 0.45, 'load_avg_1m': 0.55}
        
    def get_memory_metrics(self) -> Dict[str, float]:
        return {'used_gb': 15.2, 'available_percent': 35.0}

    def get_io_metrics(self) -> Dict[str, float]:
        return {'read_iops': 1200, 'write_iops': 750}

    def get_network_metrics(self) -> Dict[str, float]:
        return {'latency_ms': 0.15, 'tx_kbps': 9800}
