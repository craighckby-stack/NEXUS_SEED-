# systems/metrics/SystemResourceMonitor.py

import psutil
import time
import logging
from collections import deque
from typing import Deque, Union

logger = logging.getLogger(__name__)

class SystemResourceMonitor:
    """Abstracts OS-level resource querying (CPU, Memory, IO) and provides rolling averages.
    Required by RDM_Optimizer to ensure resource metrics are standardized and reliable.
    """
    def __init__(self, sample_window_size: int = 60, interval: float = 1.0):
        self.sample_window_size = sample_window_size # Metrics window in seconds
        self.interval = interval
        self._cpu_history: Deque[float] = deque(maxlen=int(sample_window_size / interval))

    def _sample_resources(self):
        """Gathers instantaneous CPU utilization."""
        # We focus on overall system CPU usage for RDM calculation
        cpu_percent = psutil.cpu_percent(interval=None) 
        self._cpu_history.append(cpu_percent / 100.0) # Store as 0.0 to 1.0 range

    def get_average_utilization(self) -> float:
        """Returns the average CPU utilization over the defined sample window (0.0 to 1.0)."""
        self._sample_resources() # Ensure a fresh sample is taken right before calculation
        if not self._cpu_history:
            return 0.0
        
        avg_util = sum(self._cpu_history) / len(self._cpu_history)
        return avg_util

    def start_sampling_loop(self):
        """In a production environment, this would run as a dedicated thread or process.
        Stub provided for definition of interface.
        """
        logger.info("SystemResourceMonitor is starting continuous resource sampling.")
        # Implementation details for asynchronous/threaded monitoring omitted for scaffolding clarity.
        
# Note: Requires 'psutil' package for real-time monitoring.