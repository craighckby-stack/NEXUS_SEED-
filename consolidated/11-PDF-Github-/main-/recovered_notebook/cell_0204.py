import time
import random
import json
from datetime import datetime
from queue import Queue

# External dependency: cryptography
try:
    from cryptography.fernet import Fernet
except ImportError:
    # Mock implementation if Fernet is not available, useful for dev environments
    class MockFernet:
        def __init__(self, key): 
            print("[WARN] Using Mock Fernet for encryption.")
        def encrypt(self, data): 
            return b'MOCK_ENCRYPTED_' + data
        def decrypt(self, data): 
            return data.replace(b'MOCK_ENCRYPTED_', b'')
    Fernet = MockFernet

# --- Configuration Constants ---
# Placeholder for secure configuration loading
ENCRYPTION_KEY = Fernet.generate_key() 
TELEMETRY_INTERVAL_SEC = 10 

class SatelliteOperator:
    """Manages data collection, processing, communication, and operational state."""
    def __init__(self, encryption_key):
        self.fernet = Fernet(encryption_key)
        self.data_queue = Queue()  # Internal buffer
        self.health_status = {
            "system_ok": True,
            "last_calib": datetime.utcnow().isoformat(),
            "mission_phase": "nominal"
        }

    # --- Sensor Simulation ---
    def get_temperature(self):
        """Simulates reading temperature with minor noise."""
        # Added Gaussian noise for realism
        return random.uniform(-20, 40) + random.normalvariate(0, 0.2)

    def get_humidity(self):
        """Simulates reading humidity."""
        return random.uniform(0, 100)

    def get_image(self):
        """Simulates capturing an image (returns a unique ID)."""
        return f"IMAGE_HASH_{random.getrandbits(32):x}"

    # --- Data Processing and Storage ---
    def process_and_queue_data(self, trigger_type="auto"):
        """Collects data, formats it into JSON, and queues it up."""
        temperature = self.get_temperature()
        humidity = self.get_humidity()
        image_id = self.get_image()

        timestamp = datetime.utcnow().isoformat()
        
        raw_data = {
            "timestamp": timestamp,
            "sequence_id": self.data_queue.qsize(), # Minor tracking
            "trigger": trigger_type,
            "sensors": {
                "temperature_C": round(temperature, 2),
                "humidity_pct": round(humidity, 2),
                "image_ref": image_id
            },
            "satellite_health": self.health_status
        }
        
        try:
            processed_payload = json.dumps(raw_data)
            self.data_queue.put(processed_payload)
            return processed_payload
        except TypeError as e:
            print(f"[ERROR] Data serialization failure: {e}")
            return None

    # --- Communication ---
    def send_data(self, data_payload):
        """Encrypts and simulates sending data to Earth."""
        if not data_payload:
            print("[COMMS] Cannot send empty payload.")
            return False

        try:
            encrypted = self.fernet.encrypt(data_payload.encode('utf-8'))
            print(f"[COMMS] Sending {len(data_payload)} bytes. Encrypted size: {len(encrypted)} bytes.")
            time.sleep(random.uniform(0.1, 1.0)) 
            return True
        except Exception as e:
            print(f"[ERROR] Transmission failed (Encryption/IO): {e}")
            return False

    def receive_command(self):
        """Simulates receiving a command from Earth with weighted probability."""
        time.sleep(random.uniform(0.1, 0.5))
        commands = ["COLLECT_DATA", "CALIBRATE_SENSORS", "QUERY_HEALTH", None]
        # Heavy weighting towards None (no command)
        return random.choices(commands, weights=[0.1, 0.05, 0.1, 0.75], k=1)[0]

    # --- Operations ---
    def calibrate_sensors(self):
        print("[OP] Initiating full sensor calibration...")
        self.health_status["system_ok"] = False
        self.health_status["mission_phase"] = "calibration"
        time.sleep(5)  
        self.health_status["system_ok"] = True
        self.health_status["last_calib"] = datetime.utcnow().isoformat()
        self.health_status["mission_phase"] = "nominal"
        print("[OP] Sensors calibrated. Nominal operation resumed.")

    def query_health(self):
        print(f"[HEALTH] Current Status Report: {self.health_status}")

    # --- Main Loop ---
    def satellite_script(self):
        print("Sovereign Satellite Operator Started (v94.1 Protocol).")
        last_collection_time = time.monotonic()

        while True:
            # 1. Command Check
            command = self.receive_command()
            if command == "COLLECT_DATA": 
                print("[CMD] Immediate collection request.")
                payload = self.process_and_queue_data(trigger_type="command")
                self.send_data(payload)
                # Reset routine timer if commanded
                last_collection_time = time.monotonic()

            elif command == "CALIBRATE_SENSORS": 
                self.calibrate_sensors()

            elif command == "QUERY_HEALTH":
                self.query_health()
            
            # 2. Routine Data Collection (Telemetry)
            if time.monotonic() - last_collection_time >= TELEMETRY_INTERVAL_SEC:
                print(f"\n[CRON] Scheduled telemetry collection ({TELEMETRY_INTERVAL_SEC}s interval).")
                payload = self.process_and_queue_data(trigger_type="scheduled")
                if payload: 
                    self.send_data(payload)
                last_collection_time = time.monotonic()

            # Prevent busy looping
            time.sleep(0.5)

# Example usage block (optional, but shows flow):
# if __name__ == '__main__':
#     op = SatelliteOperator(ENCRYPTION_KEY)
#     try:
#         op.satellite_script()
#     except KeyboardInterrupt:
#         print("\nScript terminated by user.")
