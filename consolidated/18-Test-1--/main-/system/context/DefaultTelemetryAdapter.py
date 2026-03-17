from system.context.SystemTelemetryProxy import (
    SystemTelemetryProxy,
    SystemTelemetrySnapshot,
    ResourceForecast,
    OperationalConstraints,
    SystemPerformanceIndicators
)
import time
import random

class DefaultTelemetryAdapter(SystemTelemetryProxy):
    """
    Concrete implementation of the SystemTelemetryProxy using internal hooks 
    and underlying monitoring services.
    
    NOTE: This implementation provides synthetic (mock) data for development 
    and testing until live system hooks are fully integrated.
    """
    
    def __init__(self, system_version: str):
        # Configuration hook points for monitoring services would be set here
        self._version = system_version

    def _generate_synthetic_data(self) -> SystemTelemetrySnapshot:
        """Simulates fetching real-time data from monitoring endpoints."""
        
        # --- Resource Forecast ---
        forecast: ResourceForecast = {
            "cpu_load_baseline": round(random.uniform(0.1, 0.95), 3),
            "memory_headroom_gb": round(random.uniform(1.0, 16.0), 2),
            "io_latency_p95_ms": round(random.uniform(1.5, 30.0), 1),
            "disk_utilization_ratio": round(random.uniform(0.3, 0.75), 3),
            "network_egress_bps": random.randint(1000000, 50000000)
        }
        
        # --- Operational Constraints ---
        constraints: OperationalConstraints = {
            "max_concurrency": 32, # Based on core count or license limit
            "active_version_id": self._version,
            "security_mode": 'LOCKED' if random.random() > 0.8 else 'PERMISSIVE',
            "storage_read_only": False,
            "execution_timeout_s": 60.0,
        }
        
        # --- Performance Indicators ---
        performance: SystemPerformanceIndicators = {
            "error_rate_p1m": round(random.uniform(0.0, 0.005), 4),
            "thermal_status_celsius": round(random.uniform(40.0, 75.0), 1),
            "queue_depth_max": random.randint(1, 50),
            "uptime_seconds": int(time.time() - 1672531200), 
            "self_correction_attempts_p1h": random.randint(0, 5)
        }
        
        return {
            "forecast": forecast,
            "constraints": constraints,
            "performance": performance
        }

    def get_full_snapshot(self) -> SystemTelemetrySnapshot:
        return self._generate_synthetic_data()

    # Legacy/convenience methods (derived from the full snapshot)
    def get_resource_forecast(self) -> ResourceForecast:
        return self.get_full_snapshot()['forecast']

    def get_operational_constraints(self) -> OperationalConstraints:
        return self.get_full_snapshot()['constraints']
    
    def get_performance_indicators(self) -> SystemPerformanceIndicators:
        return self.get_full_snapshot()['performance']
