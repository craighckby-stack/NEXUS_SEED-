import time
import random
import numpy as np
import logging
import uuid
from queue import Queue
import threading
import json
import os
import hashlib
import secrets
from typing import Union, Dict, Any

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')

# --- Dummy Subsystems ---
class DummyCognitiveModel:
    def __init__(self):
        # Simulation of complex internal state or weight matrix
        self.weights = np.random.rand(10, 10)

    def predict(self, question):
        """Simulates cognitive inference."""
        time.sleep(0.001) # Small delay simulation
        return question[::-1]

class DummyEthicalFramework:
    def resolve(self, dilemma):
        """Simulates ethical constraint checking and conflict resolution."""
        return f"Resolved: {hashlib.sha256(dilemma.encode()).hexdigest()[:8]}"

# --- Core Architectural Component: Sovereign Node Identity Management ---
class SovereignNode:
    """Represents an independent, cryptographically secured computational node or Agent.
    Handles key generation, signing, and signature verification essential for secure multi-agent communication.
    Refactored to handle canonical serialization of structured data before hashing and signing.
    """
    HASH_ALGORITHM = hashes.SHA256
    
    def __init__(self, node_id=None):
        self.node_id = node_id if node_id else str(uuid.uuid4())
        self._private_key = None
        self._public_key = None
        self._generate_keys()
        self.logger = logging.getLogger(f"Node.{self.node_id[:4]}")
        self.logger.info("Initialized and keys generated. Signing mechanism uses Canonical Hashing.")

    def _generate_keys(self):
        """Generates RSA 2048 private and public key pair using best practices (65537 public exponent)."""
        self._private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self._public_key = self._private_key.public_key()

    def _canonicalize_and_hash(self, data: Union[str, Dict[str, Any]]) -> bytes:
        """
        Ensures consistent data representation for signing (canonical JSON serialization if dict).
        Returns the hash digest of the canonical data representation.
        """
        if isinstance(data, dict):
            # Canonical JSON serialization: sorted keys, no whitespace separators
            serialized_data = json.dumps(
                data, 
                sort_keys=True, 
                separators=(',', ':')
            ).encode('utf-8')
        elif isinstance(data, str):
            serialized_data = data.encode('utf-8')
        else:
            raise TypeError("Data must be a string or a dictionary.")
            
        # Hash the canonical representation
        digest = hashes.Hash(self.HASH_ALGORITHM(), backend=default_backend())
        digest.update(serialized_data)
        
        # We sign the hash digest, not the whole payload.
        return digest.finalize()

    def get_public_key_pem(self) -> bytes:
        """Returns the public key serialized into PEM format for distribution."""
        return self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

    def export_private_key_encrypted(self, passphrase: str) -> bytes:
        """
        Exports the private key encrypted with a derived passphrase.
        (Architectural stub for key persistence).
        """
        self.logger.info(f"Exporting private key securely for Node {self.node_id[:4]}.")
        return self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.BestAvailableEncryption(passphrase.encode())
        )

    def sign_data(self, data: Union[str, Dict[str, Any]]) -> bytes:
        """Signs the canonical hash of the input data using PSS padding and SHA256."""
        
        # 1. Get the deterministic hash of the data payload
        hashed_data = self._canonicalize_and_hash(data)

        # 2. Sign the hash using PSS
        signature = self._private_key.sign(
            hashed_data,
            padding.PSS(
                mgf=padding.MGF1(self.HASH_ALGORITHM()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            self.HASH_ALGORITHM()
        )
        self.logger.debug(f"Data signed (hashed payload), signature length: {len(signature)}")
        return signature

    @classmethod
    def verify_signature(cls, public_key_pem: bytes, data: Union[str, Dict[str, Any]], signature: bytes) -> bool:
        """Verifies a signature against the canonical hash of the provided data payload."""
        
        # Helper function replicating canonicalization logic for static context
        def _static_canonicalize_and_hash(d: Union[str, Dict[str, Any]]) -> bytes:
            if isinstance(d, dict):
                serialized_data = json.dumps(d, sort_keys=True, separators=(',', ':')).encode('utf-8')
            elif isinstance(d, str):
                serialized_data = d.encode('utf-8')
            else:
                # Should be caught by caller, but necessary for completeness
                raise TypeError("Verification data must be a string or a dictionary.") 
                
            digest = hashes.Hash(cls.HASH_ALGORITHM(), backend=default_backend())
            digest.update(serialized_data)
            return digest.finalize()

        try:
            # 1. Re-calculate the deterministic hash of the data payload
            hashed_data = _static_canonicalize_and_hash(data)
            
            public_key = serialization.load_pem_public_key(
                public_key_pem,
                backend=default_backend()
            )
            
            # 2. Verify against the hash
            public_key.verify(
                signature,
                hashed_data, 
                padding.PSS(
                    mgf=padding.MGF1(cls.HASH_ALGORITHM()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                cls.HASH_ALGORITHM()
            )
            return True
        except InvalidSignature:
            logging.warning("Verification failed: Invalid signature.")
            return False
        except Exception as e:
            logging.error(f"Verification error: {e}")
            return False