# Reads core_runtime settings to enforce operational stability.

import os
import psutil
import time

class SystemMonitorService:
    def __init__(self, config):
        self.config = config['core_runtime']
        self.cpu_limit = self.config['resource_limits']['max_cpu_percent']
        self.memory_limit_gb = self.config['resource_limits']['max_memory_gb']

    def monitor_resources(self):
        # Check CPU usage
        current_cpu = psutil.cpu_percent(interval=1)
        if current_cpu > self.cpu_limit:
            print(f"[CRITICAL] CPU limit exceeded ({current_cpu}% > {self.cpu_limit}%). Initiating rate throttling.")
            # Logic to signal evolutionary engine to reduce parallel workers

        # Check Memory usage
        process = psutil.Process(os.getpid())
        mem_usage_gb = process.memory_info().rss / (1024 * 1024 * 1024)
        if mem_usage_gb > self.memory_limit_gb:
            print(f"[CRITICAL] Memory limit exceeded ({mem_usage_gb:.2f} GB > {self.memory_limit_gb} GB). Preparing for graceful shutdown.")
            # Logic to initiate graceful shutdown procedure using defined timeout

    def start(self):
        while True:
            self.monitor_resources()
            time.sleep(5)

# Placeholder initialization logic
# if __name__ == "__main__":
#     from config_loader import load_config # Assume this exists
#     config_data = load_config("TEDS_Config_V1.json") 
#     monitor = SystemMonitorService(config_data)
#     monitor.start()
