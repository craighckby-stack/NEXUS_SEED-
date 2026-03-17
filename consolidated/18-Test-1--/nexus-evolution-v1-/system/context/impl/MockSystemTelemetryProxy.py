from system.context.SystemTelemetryProxy import (
    SystemTelemetryProxy, 
    ResourceForecast, 
    OperationalConstraints, 
    SystemPerformanceIndicators
)
import time

class MockSystemTelemetryProxy(SystemTelemetryProxy):
    """A mock implementation of the Telemetry Proxy for testing and simulation."""

    _START_TIME = time.time()

    def get_resource_forecast(self) -> ResourceForecast:
        # Simulate stable, mid-range forecast
        return {
            "cpu_load_baseline": 0.45,
            "memory_headroom_gb": 12.5,
            "io_latency_p95_ms": 3.2,
            "disk_utilization_ratio": 0.61
        }

    def get_operational_constraints(self) -> OperationalConstraints:
        # Simulate standard operational constraints
        return {
            "max_concurrency": 32,
            "active_version_id": "v94.1.20240905",
            "security_mode": "HARDENED",
            "storage_read_only": False
        }
    
    def get_performance_indicators(self) -> SystemPerformanceIndicators:
        # Simulate stable operational health
        return {
            "error_rate_p1m": 0.001,
            "thermal_status_celsius": 45.1,
            "queue_depth_max": 5,
            "uptime_seconds": int(time.time() - self._START_TIME)
        }
