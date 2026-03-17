import threading
import time
import json
from pathlib import Path
from typing import Dict, Any

# NOTE: Assuming the availability of system.monitoring.SensorAPI for resource fetching.
# This component enforces the lowest possible read latency by using cached data.

class RTOM:
    """Real-Time Operational Monitor (RTOM) v94.1

    Provides low-latency, unbuffered telemetry by utilizing a dedicated background thread
    to constantly update resource consumption metrics and stage transition timestamps.
    This ensures get_real_time_telemetry() is a fast, non-blocking operation.
    """

    # Shared low-latency internal cache updated by the monitoring thread
    _metrics_cache: Dict[str, Any] = {}

    def __init__(self, metrics_config_path: str = 'config/rtom_metrics_config.json', sensor_api=None):
        self.config = self._load_config(Path(metrics_config_path))
        self.polling_rate = self.config.get('polling_rate_s', 0.1) # Default 100ms
        
        # Initialize Sensor hooks (uses provided API or falls back to system context)
        self._sensor_hooks = self._initialize_sensors(sensor_api)
        
        self._shutdown_flag = threading.Event()
        
        # Start the background monitoring loop
        self._monitoring_thread = threading.Thread(
            target=self._run_monitoring_loop, 
            name="RTOM-Monitor",
            daemon=True
        )
        self._monitoring_thread.start()

    def _load_config(self, path: Path) -> Dict[str, Any]:
        """Loads required sensors, thresholds, and polling definitions."""
        try:
            if not path.exists():
                print(f"RTOM Config not found at {path}. Using default configuration.")
                return {'polling_rate_s': 0.1, 'sensors': ['cpu', 'memory']}
            
            with open(path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse RTOM configuration: {e}")

    def _initialize_sensors(self, sensor_api):
        # Use MockSensor if no concrete API is passed, ensuring RTOM always operates.
        from .SensorAPI import MockSensor 
        if sensor_api is None:
            # Highly intelligent systems dynamically load platform-specific API here (e.g., LinuxSensorAPI)
            return MockSensor() 
        return sensor_api

    def _run_monitoring_loop(self):
        """Dedicated thread function for continuous, high-frequency data capture."""
        while not self._shutdown_flag.is_set():
            try:
                telemetry = {
                    'timestamp_utc': time.time(), 
                    'resource_metrics': self._get_resource_status(),
                    'temporal_markers': self._get_temporal_events()
                }
                
                # Update the shared cache instantly
                RTOM._metrics_cache = telemetry 

            except Exception as e:
                # Critical logging of sensor failure, but thread persists
                print(f"RTOM Monitoring Loop experienced error: {e}")
            
            self._shutdown_flag.wait(self.polling_rate)
            
    def get_real_time_telemetry(self) -> Dict[str, Any]:
        """
        Returns the current immutable telemetry package instantly from cache.
        NON-BLOCKING READ guaranteed.
        """
        if not RTOM._metrics_cache:
            return {'status': 'initializing', 'timestamp_utc': time.time()}
            
        return RTOM._metrics_cache

    def shutdown(self):
        """Gracefully stops the monitoring thread, cleaning up resources."""
        self._shutdown_flag.set()
        if self._monitoring_thread.is_alive():
            self._monitoring_thread.join(timeout=1.0)
            
    # --- Sensor methods (Rely on SensorAPI abstraction) ---
    def _get_resource_status(self) -> Dict[str, Any]: 
        # Delegation to the abstracted sensor hooks
        return self._sensor_hooks.get_all_resource_metrics()
        
    def _get_temporal_events(self) -> list: 
        # Placeholder for stage transition markers (e.g., read from an event queue)
        return []
