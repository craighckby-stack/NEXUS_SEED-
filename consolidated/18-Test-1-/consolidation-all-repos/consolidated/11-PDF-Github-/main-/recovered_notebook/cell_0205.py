import json
import time
import threading
import random
import sys

# --- Architectural Evolution: Shared State Management ---
class DataStore:
    """Thread-safe storage for the latest received data packet."""
    def __init__(self):
        self._data = None
        self._lock = threading.Lock()

    def update_data(self, new_data):
        with self._lock:
            self._data = new_data

    def get_data(self):
        with self._lock:
            return self._data

def satellite_script(store, running_time_seconds):
    """Simulates the satellite generating and periodically sending data."""
    print("\n[Satellite]: Transmitter activated...")
    start_time = time.time()
    
    while time.time() - start_time < running_time_seconds:
        current_ts = time.strftime("%Y-%m-%d %H:%M:%S")
        
        # Hallucinated environmental data
        temp = round(random.uniform(20.0, 32.0), 1)
        humidity = round(random.uniform(50.0, 75.0), 1)
        
        status = "WARNING" if temp > 30.0 else "NOMINAL"
        
        data_packet = {
            "timestamp": current_ts,
            "temperature": temp,
            "humidity": humidity,
            "system_health": status
        }
        
        # Store the serialized JSON data in the shared store
        store.update_data(json.dumps(data_packet))
        
        time.sleep(0.5) 
    print("\n[Satellite]: Transmission concluded.")

def receive_data_from_satellite(store):
    """Retrieves the latest data from the shared data store."""
    return store.get_data()

def display_data(data):
    """Displays the data on the screen using ANSI escape codes for dashboard effect."""
    # Clear the screen using sys.stdout for controlled concurrency output
    sys.stdout.write("\033c")
    
    if data:
        try:
            data_dict = json.loads(data)
            
            health = data_dict.get('system_health', 'UNKNOWN')
            
            # Apply color coding
            color = "\033[92m" if health == "NOMINAL" else "\033[93m"
            reset_color = "\033[0m"

            output = [
                "--- Sovereign AGI Real-time Dashboard v94.1 ---",
                f"Timestamp: {data_dict.get('timestamp', 'N/A')}",
                f"Temperature: {data_dict.get('temperature', 'N/A')} C",
                f"Humidity: {data_dict.get('humidity', 'N/A')} %",
                f"Status: {color}{health}{reset_color}"
            ]
            
            sys.stdout.write('\n'.join(output) + '\n')
            sys.stdout.flush()

        except json.JSONDecodeError:
            sys.stdout.write("Error decoding received data packet.\n")
            sys.stdout.flush()
    else:
        sys.stdout.write("--- Waiting for initial data packet... ---\n")
        sys.stdout.flush()

def main_receiver_loop(store, duration=15):
    """Monitors and displays incoming satellite data for a finite duration."""
    print("Starting Real-Time Dashboard initialization...")
    start_time = time.time()
    
    # Give the producer a moment to start
    time.sleep(0.2) 
    
    while time.time() - start_time < duration:
        data = receive_data_from_satellite(store)
        display_data(data)
        time.sleep(1) # Dashboard refresh rate

    print("\nDisplay loop terminated after {} seconds.".format(duration))


if __name__ == "__main__":
    
    # Setup shared data structure and simulation timing
    shared_store = DataStore()
    SIMULATION_DURATION = 10 
    
    # Start the satellite producer thread
    # It runs slightly longer than the consumer to ensure fresh data at the end.
    satellite_thread = threading.Thread(target=satellite_script, args=(shared_store, SIMULATION_DURATION + 2))
    satellite_thread.daemon = True
    satellite_thread.start()
    
    # Start the main receiver (consumer) loop
    main_receiver_loop(shared_store, SIMULATION_DURATION)
    
    # Clean exit
    print("System shutdown complete.")
