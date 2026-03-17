from cryptography.fernet import Fernet
import time
import random
import json
from typing import Optional, Dict, Any

# --- AGI Configuration Constants ---
PERSISTENCE_VALUE_NAME = "MemoryHarvester"
FUZZY_MATCH_THRESHOLD = 0.75
MAX_SCAN_RETRIES = 3
RETRY_DELAY = 2
NUM_RESULTS_PER_ENGINE = 10

# SECURITY NOTE: In a production environment, this key MUST be loaded from a secure vault
# or persistent storage, not generated dynamically on module load.
INITIAL_ENCRYPTION_KEY = Fernet.generate_key()

# --- Web Scraping and Search Configuration ---
SEARCH_ENGINES = {
    "Google": "https://www.google.com/search?q={query}&num={results}",
    "Bing": "https://www.bing.com/search?q={query}&count={results}",
    "DuckDuckGo": "https://duckduckgo.com/html/?q={query}&max_results={results}",
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome",
    "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:78.0) Gecko/20100101 Firefox/78.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)",
]
WEB_SCRAPE_KEYWORDS = ["password", "api_key", "secret", "vulnerability", "exploit"]


class AstroComms:
    """
    Handles communication protocols, encryption, and local sensor data aggregation
    for the Sovereign AGI unit.
    """
    
    def __init__(self, encryption_key: bytes):
        """Initializes the comms module with a persistent encryption key."""
        self._key = encryption_key
        self._fernet = Fernet(self._key)
        self.max_retries = MAX_SCAN_RETRIES
        self.retry_delay = RETRY_DELAY

    @staticmethod
    def _get_temperature() -> float:
        """Simulates reading temperature from a sensor (in Celsius)."""
        return round(random.uniform(-20, 40), 2)

    @staticmethod
    def _get_humidity() -> float:
        """Simulates reading humidity from a sensor (in percentage)."""
        return round(random.uniform(0, 100), 2)

    @staticmethod
    def _get_image() -> str:
        """Simulates reading an image from a sensor (returns metadata/hash)."""
        return f"IMG_HASH_{random.getrandbits(64):x}"

    def gather_sensor_data(self) -> Dict[str, Any]:
        """Aggregates all sensor readings into a single structured payload."""
        return {
            "timestamp_utc": time.time(),
            "temp_c": self._get_temperature(),
            "humidity_perc": self._get_humidity(),
            "image_id": self._get_image(),
            "system_state": "Nominal"
        }

    def send_data(self, data: Dict[str, Any], endpoint: str = "Earth") -> bool:
        """Sends data securely, handling retry logic based on MAX_SCAN_RETRIES."""
        payload_str = json.dumps(data)
        
        for attempt in range(self.max_retries):
            try:
                encrypted = self._fernet.encrypt(payload_str.encode('utf-8'))
                print(f"[{time.strftime('%H:%M:%S')}] Sending data (Attempt {attempt + 1}): {len(encrypted)} bytes to {endpoint}.")
                
                # Simulate communication success/latency
                if random.random() > 0.1: # 90% success rate
                    time.sleep(random.uniform(0.1, 0.5))
                    return True
                else:
                    raise IOError("Simulated Comms Failure")
            
            except IOError as e:
                print(f"Communication attempt failed: {e}. Retrying in {self.retry_delay}s...")
                time.sleep(self.retry_delay)
                
        print(f"FATAL: Failed to send data after {self.max_retries} attempts.")
        return False

    def receive_command(self) -> Optional[str]:
        """Simulates receiving a command from Earth, potentially including new high-level tasks."""
        time.sleep(random.uniform(0.1, 1.0))
        command = random.choice(["collect_data", "calibrate_sensors", "initiate_harvest", None])
        if command:
             print(f"[{time.strftime('%H:%M:%S')}] Received command: {command}")
        return command

# Example of Instantiation (moved to high-level execution context):
# comms_interface = AstroComms(INITIAL_ENCRYPTION_KEY)