```python
import time
import numpy as np
import random
import hashlib
import struct
import threading
from queue import Queue
import uuid
import copy
import matplotlib.pyplot as plt

try:
    with open("config.json", "r") as f:
        config = json.load(f)
except FileNotFoundError:
    print("Error: config.json not found. Using default values.")
    config = {}
except json.JSONDecodeError:
    print("Error: Invalid config.json format. Using default values.")
    config = {}

random_seed = config.get("simulation", {}).get("random_seed", 42)
random.seed(random_seed)
np.random.seed(random_seed)

logging.basicConfig(
    filename=config.get("simulation", {}).get("log_file", "simulation.log"),
    level=config.get("simulation", {}).get("log_level", "INFO"),
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class Essence:
    def __init__(self, unique_id=None, properties=None):
        self.unique_id = unique_id or str(uuid.uuid4())
        self.properties = properties or {}

    def __hash__(self):
        return hash(self.unique_id)

    def __eq__(self, other):
        return isinstance(other, Essence) and self.unique_id == other.unique_id

    def merge(self, other):
        if not isinstance(other, Essence):
            return
        for key, value in other.properties.items():
            if key not in self.properties:
                self.properties[key] = value
            elif isinstance(value, (int, float)) and isinstance(self.properties[key], (int, float)):
                self.properties[key] = (self.properties[key] + value) / 2

plt.subplot(2, 1, 1)
for data in riemann_data:
    if data['tolerance_history']:
        plt.plot(range(len(data['tolerance_history'])), data['tolerance_history'])
plt.yscale('log')
plt.xlabel("Zero Iteration")
plt.ylabel("Tolerance")
plt.title("Riemann Hypothesis Testing - Tolerance Over Iterations")
plt.legend()
plt.grid()

'''
# Output/logs
'''