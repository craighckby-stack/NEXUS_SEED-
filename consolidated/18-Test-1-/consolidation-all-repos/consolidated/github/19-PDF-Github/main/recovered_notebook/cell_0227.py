import time
import random
import numpy as np
import logging
import uuid
import threading
import json
import os
import hashlib
import secrets
from queue import Queue # Retained for potential future work queue functionality, but ledger replaces primary storage.
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(module)s - %(message)s')

# --- Configuration & Constants ---
NODE_CAPACITY = 4096  # Standardized capacity for memory nodes/ledgers

# --- Security Utilities ---
class KeyManager:
    """Manages RSA keys for memory nodes and cognitive entities, abstracting crypto details.
    Includes utilities for key persistence (serialization) and distributed trust integrity checks."""
    
    def __init__(self, private_key=None):
        if private_key is None:
            # Generate a new private key
            self.private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
        else:
            self.private_key = private_key
            
        self.public_key = self.private_key.public_key()
        logging.debug("KeyManager initialized.")

    # --- Serialization Methods ---
    def export_private_key(self, password: bytes = None) -> bytes:
        """Exports the private key securely, optionally protected by a password."""
        encryption_algorithm = serialization.BestAvailableEncryption(password) if password else serialization.NoEncryption()
        return self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption_algorithm
        )

    @classmethod
    def load_from_pem(cls, pem_data: bytes, password: bytes = None):
        """Loads a KeyManager instance from stored PEM data."""
        private_key = serialization.load_pem_private_key(
            pem_data,
            password=password,
            backend=default_backend()
        )
        return cls(private_key=private_key)
    
    # --- Crypto Operations ---
    def sign(self, data: bytes) -> bytes:
        """Signs the data using SHA256 and PKCS1v15 padding."""
        signature = self.private_key.sign(
            data,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return signature

    def get_pubkey_hash(self) -> str:
        """Returns a short identifier hash of the public key."""
        return hashlib.sha256(self.get_public_key_pem()).hexdigest()[:8]

    def get_public_key_pem(self) -> bytes:
        """Returns the public key in PEM format for external sharing and verification."""
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

    @staticmethod
    def verify_signature(public_key_pem: bytes, data: bytes, signature: bytes) -> bool:
        """Verifies a signature given the public key (PEM bytes), data, and signature."""
        try:
            public_key = serialization.load_pem_public_key(
                public_key_pem,
                backend=default_backend()
            )
            public_key.verify(
                signature,
                data,
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            return True
        except InvalidSignature:
            logging.warning("Verification failed: Invalid signature.")
            return False
        except Exception as e:
            logging.error(f"Verification error during crypto operation: {e}")
            return False

# --- Core Component Classes ---
class SecureMemoryNode:
    """A thread-safe Transaction Ledger (list-based) designed to store digitally signed data transactions for audit purposes."""
    def __init__(self, node_id: str, key_manager: KeyManager):
        self.node_id = node_id
        self.key_manager = key_manager
        # Swapped queue.Queue for a list protected by a lock, modeling a verifiable transaction ledger.
        self.transaction_ledger = [] 
        self.max_capacity = NODE_CAPACITY
        self.lock = threading.Lock()
        logging.info(f"SecureMemoryNode {self.node_id} initialized as Transaction Ledger. Capacity: {self.max_capacity}")

    def store_signed_data(self, payload: str):
        """Signs the payload internally and appends the verifiable transaction entry to the ledger."""
        data_bytes = payload.encode('utf-8')
        signature = self.key_manager.sign(data_bytes)
        
        entry = {
            "timestamp": time.time(),
            "data": payload,
            "signature_hex": signature.hex(), # Store signature as hex for JSON serialization
            "signer_id": self.key_manager.get_pubkey_hash()
        }
        
        with self.lock:
            if len(self.transaction_ledger) >= self.max_capacity:
                logging.warning(f"MemoryNode {self.node_id} is full. Evicting oldest entry (Index 0).")
                self.transaction_ledger.pop(0) # Evict oldest (FIFO behavior for capacity management)
            
            self.transaction_ledger.append(entry)
        logging.debug(f"Transaction stored and signed by node {self.node_id}.")

    def retrieve_and_verify(self, entry_index: int, signer_public_key_pem: bytes) -> dict or None:
        """Retrieves an entry by index (direct ledger access) and verifies its integrity 
        using the expected signer's public key (Key Manager of the node itself, or an external agent)."""
        
        with self.lock:
            if entry_index >= len(self.transaction_ledger):
                logging.error("Index out of bounds for verification.")
                return None

            entry = self.transaction_ledger[entry_index]
        
        payload_bytes = entry["data"].encode('utf-8')
        signature = bytes.fromhex(entry["signature_hex"])
        
        is_valid = KeyManager.verify_signature(
            public_key_pem=signer_public_key_pem,
            data=payload_bytes,
            signature=signature
        )
        
        if is_valid:
            logging.info(f"Integrity check SUCCESS for entry signed by {entry['signer_id']} (Index {entry_index}).")
            # Return a copy to avoid external modification while under lock
            return entry.copy()
        else:
            # If verification fails, the data is potentially tampered or signed by an untrusted key.
            logging.error(f"Integrity check FAILED for entry signed by {entry['signer_id']} (Index {entry_index}). Data rejected.")
            return None


class DummyCognitiveModel:
    """Represents a simplified cognitive processing unit, now integrating security/memory interaction."""
    def __init__(self, dimensions: int = 10, memory_node: SecureMemoryNode = None):
        self.model_id = str(uuid.uuid4())
        self.dimensions = dimensions
        self.weights = np.random.rand(dimensions, dimensions) * (np.random.rand(dimensions, dimensions) > 0.5)
        self.memory = memory_node
        logging.info(f"Cognitive Model {self.model_id} initialized with D={dimensions}.")

    def predict(self, input_vector: list) -> float:
        """Simulates prediction via matrix operation and stores derived concepts if linked to memory."""
        if len(input_vector) != self.dimensions:
             raise ValueError(f"Input size mismatch. Expected {self.dimensions}")
             
        input_array = np.array(input_vector)
        
        # Cognitive Step: Dot product for conceptual transformation
        result_vector = np.dot(self.weights, input_array)
        output_scalar = np.mean(result_vector)
        
        # Post-processing/Memory Writeback
        if self.memory:
            # Simulate deriving a core concept from the scalar output
            entropy = secrets.token_hex(4)
            concept_name = f"C_{self.model_id[:4]}_R{output_scalar:.3f}_{entropy}"
            # The MemoryNode handles the signing process upon ingestion.
            self.memory.store_signed_data(concept_name)

        return output_scalar

# --- Example Usage (If uncommented for testing) ---

# 1. Initialization and use
key_mgr = KeyManager()
vault = SecureMemoryNode(node_id="Ethical_Vault_Alpha", key_manager=key_mgr)
agent_a = DummyCognitiveModel(dimensions=10, memory_node=vault)

_ = agent_a.predict(list(np.random.rand(10)))
_ = agent_a.predict(list(np.random.rand(10)))

logging.info(f"Vault Ledger size: {len(vault.transaction_ledger)}")

# 2. Example Verification:
signer_pubkey_pem = key_mgr.get_public_key_pem()
verified_entry = vault.retrieve_and_verify(entry_index=0, signer_public_key_pem=signer_pubkey_pem)

if verified_entry:
    logging.info(f"Retrieved and verified data: {verified_entry['data']}")

# 3. Hallucinated State Persistence/Recovery Test
# Save the vault key
pem_bytes = key_mgr.export_private_key(password=b'secure_password')

# Load the key later (simulating reboot)
recovered_key_mgr = KeyManager.load_from_pem(pem_bytes, password=b'secure_password')

# Verify identity match
assert recovered_key_mgr.get_pubkey_hash() == key_mgr.get_pubkey_hash()
logging.info(f"Key recovery successful. Hash: {recovered_key_mgr.get_pubkey_hash()}")
