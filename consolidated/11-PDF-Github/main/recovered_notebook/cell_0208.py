```python
import random
import json
import datetime
import time
from queue import Queue

def get_temperature():
    """Simulates reading temperature from a sensor."""
    return random.uniform(-20, 40)  # Celsius

def get_humidity():
    """Simulates reading humidity from a sensor."""
    return random.uniform(0, 100)  # percentage

def get_image():
    """Simulates capturing an image."""
    return "Simulated Image Data - Placeholder"

def process_data(temperature, humidity, image):
    """Processes the data."""
    timestamp = datetime.utcnow().isoformat()
    data = {
        "timestamp": timestamp,
        "temperature": temperature,
        "humidity": humidity,
        "image": image,
    }
    return json.dumps(data)

data_queue = Queue()

def receive_data_from_satellite():
    """Simulated implementation - replace with real logic"""
    if not data_queue.empty():
        return data_queue.get()
    return None

def satellite_script():
    print("Satellite script started.")
    while True:
        command = receive_command()
        if command == "collect_data":
            print("Collecting data...")
            temperature = get_temperature()
            humidity = get_humidity()
            image = get_image()
            processed_data = process_data(temperature, humidity, image)
            data_queue.put(processed_data)  # Store the processed data
            send_data(processed_data)
        elif command == "calibrate_sensors":
            print("Calibrating sensors (Simulated)...")
            time.sleep(5)  # Simulated calibration time
            print("Sensors calibrated.")
        elif command is None:
            print("No command")
        else:
            print(f"Unknown command: {command}")
        time.sleep(60)  # Collect data every minute.

def display_data(data):
    """Displays the data on the screen."""
    if data:
        try:
            data_dict = json.loads(data)  # Parse the JSON
            print("\033c", end="")  # Clear the screen (ANSI escape code)
            print("--- Real-time Environmental Data ---")
            print(f"Timestamp: {data_dict['timestamp']}")
            print(f"Temperature: {data_dict['temperature']}")
            print(f"Humidity: {data_dict['humidity']}")
        except json.JSONDecodeError:
            print("Error decoding data.")
    else:
        print("\033c")

# 
# Output/logs:
# 
# Satellite script started.
# Collecting data...
# Sensors calibrated.
# No command
# Unknown command: some_command
# Error decoding data.
```