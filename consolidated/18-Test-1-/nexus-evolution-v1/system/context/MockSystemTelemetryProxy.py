from typing import Dict, Any
from .SystemTelemetryProxy import SystemTelemetryProxy

class MockSystemTelemetryProxy(SystemTelemetryProxy):
    """
    A concrete implementation of the SystemTelemetryProxy protocol used for 
    testing, initial bootstrapping, or simulations when real monitoring is unavailable. 
    Provides fixed, representative placeholder values (the original implementation data).
    
    Refactor: Defined mock data as class constants for clearer separation of data and retrieval logic.
    """
    
    _RESOURCE_FORECAST_DATA: Dict[str, float] = {
        "cpu_load_baseline": 0.45,
        "memory_headroom": 2.5, 
        "i/o_latency_p95": 15.0 
    }
    
    _CONSTRAINT_STATUS_DATA: Dict[str, Any] = {
        "MAX_CONCURRENCY": 1024,
        "ACTIVE_VERSION_ID": "v94.0-stable",
        "SECURITY_MODE": "Hardened"
    }

    def get_resource_forecast(self) -> Dict[str, float]:
        """
        Retrieves mock resource forecast data.
        """
        return self._RESOURCE_FORECAST_DATA
    
    def get_constraint_status(self) -> Dict[str, Any]:
        """
        Retrieves mock operational constraints status.
        """
        return self._CONSTRAINT_STATUS_DATA
