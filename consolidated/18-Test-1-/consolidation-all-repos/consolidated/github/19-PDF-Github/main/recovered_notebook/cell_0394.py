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
import logging
import json
import spacy

# --- Global Configuration Storage ---
GLOBAL_CONFIG = {}

def load_configuration(filename="config.json"):
    """Loads configuration data from a JSON file, handling errors and defaults."""
    global GLOBAL_CONFIG
    default_config = {
        "simulation": {
            "random_seed": 42,
            "log_file": "simulation.log",
            "log_level": "INFO",
            "initialize_nlp_engine": True
        },
        "nlp": {
            "model": "en_core_web_sm" # Default small model
        }
    }

    try:
        with open(filename, "r") as f:
            config_data = json.load(f)
            # Simple merge: prioritize file content over defaults for existing keys
            for section, values in default_config.items():
                config_data.setdefault(section, values)
                for key, val in values.items():
                     config_data[section].setdefault(key, val)
            
            GLOBAL_CONFIG = config_data
            return config_data
    except (FileNotFoundError, json.JSONDecodeError, Exception) as e:
        # Original behavior: log error and use defaults
        if isinstance(e, FileNotFoundError):
            print(f"Error: {filename} not found. Using default values.")
        elif isinstance(e, json.JSONDecodeError):
            print(f"Error: Invalid {filename} format. Using default values.")
        else:
             print(f"Error loading config: {e}. Using default values.")
        
        GLOBAL_CONFIG = default_config
        return default_config

# --- Configuration and Initialization ---
config = load_configuration()

# --- Set Random Seeds ---
random_seed = config.get("simulation", {}).get("random_seed", 42)
random.seed(random_seed)
np.random.seed(random_seed)

# --- Configure Logging ---
logging.basicConfig(
    filename=config.get("simulation", {}).get("log_file", "simulation.log"),
    # Use getattr to safely convert string level to logging constant
    level=getattr(logging, config.get("simulation", {}).get("log_level", "INFO").upper(), logging.INFO),
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logging.info(f"System initialized with seed {random_seed}.")

# --- Core Classes ---
class Essence:
    """A fundamental atomic unit carrying intrinsic properties and a unique identity."""
    def __init__(self, unique_id=None, properties=None):
        self.unique_id = unique_id or str(uuid.uuid4())
        self.properties = properties or {}

    def __hash__(self):
        return hash(self.unique_id)

    def __eq__(self, other):
        return isinstance(other, Essence) and self.unique_id == other.unique_id

    def __repr__(self):
        return f"<Essence ID={self.unique_id[:8]} Properties={len(self.properties)}>"

    def merge(self, other):
        """Integrates properties from another Essence, prioritizing existing properties."""
        if not isinstance(other, Essence):
            logging.warning("Attempted non-Essence merge.")
            return
        for key, value in other.properties.items():
            if key not in self.properties:
                self.properties[key] = value

# --- Hallucinated Core Component (Addresses logged error: AdvancedCognitiveModel) ---

class AdvancedCognitiveModel:
    """
    A core processor handling semantic parsing and context vector generation 
    using specialized NLP infrastructure (spacy).
    """
    def __init__(self, nlp_model_name=config.get("nlp", {}).get("model", "en_core_web_sm")):
        self.nlp = self._load_nlp_model(nlp_model_name)
        self.mutex = threading.Lock()
        logging.info(f"ACM attempting initialization with model: {nlp_model_name}")

    def _load_nlp_model(self, model_name):
        try:
            return spacy.load(model_name)
        except OSError as e:
            logging.error(f"SpaCy model '{model_name}' not loaded. Required data missing or broken: {e}")
            return None # NLP engine disabled if load fails

    def process_text(self, text: str) -> dict:
        """Processes raw text input and extracts structured semantic data."""
        if not self.nlp:
            return {"error": "NLP Engine offline", "text": text}
            
        with self.mutex:
            doc = self.nlp(text)
        
        # Output structure suitable for Essence properties or data store
        return {
            "tokens": [token.text for token in doc],
            "entities": [(ent.text, ent.label_) for ent in doc.ents],
            "sentiment_score": np.mean([t.sentiment for t in doc if t.has_sentiment]) if spacy.util.is_package("textacy") else None, # Placeholder for advanced feature
            "vector": doc.vector.tolist() if doc.has_vector else None
        }

# Initialize Core NLP Engine (Resolves the previously reported NameError)
CORE_NLP_ENGINE = None
if config.get("simulation", {}).get("initialize_nlp_engine", True):
    try:
        CORE_NLP_ENGINE = AdvancedCognitiveModel()
    except Exception as e:
        logging.critical(f"FATAL: Failed to initialize AdvancedCognitiveModel. System stability compromised: {e}")
        # Fallback needed if core component fails
