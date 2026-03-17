import time
from typing import Any, Optional, Dict
import numpy as np
import random
# import hashlib
# import struct
# import threading
# from queue import Queue
import uuid
import copy
# import matplotlib.pyplot as plt
import logging
import json
# import spacy
# from mpmath import findroot, zeta, mp

try:
    with open("config.json", "r") as f:
        config = json.load(f)
except FileNotFoundError:
    logging.warning("Error: config.json not found. Using default values.")
    config = {}
except json.JSONDecodeError:
    logging.error("Error: Invalid config.json format. Using default values.")
    config = {}

# Centralize config access
SIM_CONFIG = config.get("simulation", {})

random_seed = SIM_CONFIG.get("random_seed", 42)
random.seed(random_seed)
np.random.seed(random_seed)

logging.basicConfig(
    filename=SIM_CONFIG.get("log_file", "simulation.log"),
    level=SIM_CONFIG.get("log_level", "INFO"),
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def deep_merge(target: Dict[str, Any], source: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively merges two dictionaries, prioritizing deeper integration based on type."""
    for key, value in source.items():
        if key not in target:
            target[key] = copy.deepcopy(value)
        else:
            existing = target[key]
            
            if isinstance(existing, dict) and isinstance(value, dict):
                target[key] = deep_merge(existing, value) 
            
            elif isinstance(existing, list) and isinstance(value, list):
                # Use set conversion for efficient union, then convert back to list
                target[key] = list(set(existing) | set(value))
                
            elif isinstance(existing, (int, float)) and isinstance(value, (int, float)):
                # Averaging numerical values (Refinement of original heuristic)
                target[key] = (existing + value) / 2
                
            elif isinstance(existing, str) and isinstance(value, str):
                # Concatenate strings with a separator (ensuring uniqueness is a deeper architectural decision)
                if existing and value and existing != value:
                    target[key] = f"{existing} {value}"
                elif not existing:
                    target[key] = value

            # If types conflict or specific merge rules don't apply, prioritize the incoming source value
            else:
                target[key] = copy.deepcopy(value)
                
    return target


class Essence:
    def __init__(self, unique_id: Optional[str] = None, properties: Optional[Dict[str, Any]] = None):
        self.unique_id = unique_id or str(uuid.uuid4())
        self.properties = properties if properties is not None else {}

    def __hash__(self) -> int:
        return hash(self.unique_id)

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Essence) and self.unique_id == other.unique_id

    def merge(self, other: 'Essence') -> None:
        """Merges properties from another Essence object, using deep_merge logic."""
        if not isinstance(other, Essence):
            logging.warning(f"Attempted to merge Essence {self.unique_id} with non-Essence object: {type(other)}")
            return
        
        # Use the utility function for recursive, type-aware merging
        deep_merge(self.properties, other.properties)

    def get_property(self, key: str, default: Optional[Any] = None) -> Any:
        return self.properties.get(key, default)

    def set_property(self, key: str, value: Any) -> None:
        self.properties[key] = value

# Example output/logs:
# 2022-01-01 12:00:00 - INFO - Simulation started
# 2022-01-01 12:00:01 - INFO - Essence object created with id 1234567890
# 2022-01-01 12:00:02 - WARNING - config.json not found.