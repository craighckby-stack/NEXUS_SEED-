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
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding, utils
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.backends import default_backend

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(threadName)s - %(levelname)s - %(message)s')

# Global utility for serialization padding
SIG_PADDING = padding.PSS(
    mgf=padding.MGF1(hashes.SHA256()),
    salt_length=padding.PSS.MAX_LENGTH
)

# --- Component Definitions ---

class AgentCryptography:
    """Handles cryptographic key generation and message signing for integrity."""
    def __init__(self, key_size=2048):
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()
        logging.info(f"Cryptographic agent initialized: {key_size}-bit RSA.")

    def sign_data(self, data: bytes) -> bytes:
        """Signs the hash of the provided data."""
        signature = self.private_key.sign(
            data,
            SIG_PADDING,
            hashes.SHA256()
        )
        return signature

    def verify_signature(self, data: bytes, signature: bytes) -> bool:
        """Verifies the signature against the public key."""
        try:
            self.public_key.verify(
                signature,
                data,
                SIG_PADDING,
                hashes.SHA256()
            )
            return True
        except InvalidSignature:
            return False


class AdvancedCognitiveModel:
    """A secure cognitive unit that generates signed assertions."""
    def __init__(self, crypto_handler: AgentCryptography):
        self.knowledge = {
            "mathematics": "The answer is 42. This is a foundational constant.",
            "physics": "E=mc^2. Energy equivalence principle.",
        }
        self.crypto = crypto_handler

    def process_query(self, query: str) -> dict:
        """Processes a query and returns a signed assertion/response structure."""
        query_id = str(uuid.uuid4())
        response_content = self.knowledge.get(query.lower(), "I don't know the answer to that specific knowledge domain.")

        raw_assertion = {
            "query_id": query_id,
            "timestamp": time.time(),
            "response": response_content,
            "model_version": "v94.1_core_b"
        }

        # Prepare assertion for signing (must be canonical JSON or similar byte sequence)
        data_to_sign = json.dumps(raw_assertion, sort_keys=True).encode('utf-8')
        
        signature = self.crypto.sign_data(data_to_sign)

        # Final signed output structure
        signed_assertion = {
            "assertion": raw_assertion,
            "signature": signature.hex(),
            "signer_pub_key": self.crypto.public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode('utf-8')
        }
        return signed_assertion


class AgentCoreScheduler(threading.Thread):
    """Manages asynchronous task execution for cognitive processing."""
    def __init__(self, task_queue: Queue, cognitive_model: AdvancedCognitiveModel, name="Scheduler-001"):
        super().__init__(name=name)
        self.task_queue = task_queue
        self.model = cognitive_model
        self.running = True

    def run(self):
        logging.info(f"{self.name} starting operation.")
        while self.running or not self.task_queue.empty():
            try:
                # Task format: {'query': str, 'callback': callable}
                task = self.task_queue.get(timeout=1)
                query = task['query']
                logging.info(f"Processing incoming query: {query}")
                
                result = self.model.process_query(query)
                
                if task.get('callback'):
                    task['callback'](result)
                
                self.task_queue.task_done()

            except (Queue.Empty, KeyError):
                time.sleep(0.01)
            except Exception as e:
                logging.error(f"Task processing failed: {e}")

    def stop(self):
        self.running = False
        logging.info(f"{self.name} shutting down.")


# --- Execution Example (Demonstrating security and concurrency) ---

if __name__ == '__main__':
    task_queue = Queue()
    crypto_manager = AgentCryptography()
    cog_model = AdvancedCognitiveModel(crypto_manager)
    scheduler = AgentCoreScheduler(task_queue, cog_model)
    
    scheduler.start()

    # Example callback function
    def handle_result(signed_data):
        print("\n--- RECEIVED ASSERTION ---")
        print(json.dumps(signed_data['assertion'], indent=2))
        
        # Verification step using the received public key
        raw_assertion_bytes = json.dumps(signed_data['assertion'], sort_keys=True).encode('utf-8')
        signature_bytes = bytes.fromhex(signed_data['signature'])

        # For verification, we need to deserialize the public key
        pub_key_bytes = signed_data['signer_pub_key'].encode('utf-8')
        verifier_key = serialization.load_pem_public_key(
            pub_key_bytes,
            backend=default_backend()
        )

        is_valid = False
        try:
            verifier_key.verify(
                signature_bytes,
                raw_assertion_bytes,
                SIG_PADDING,
                hashes.SHA256()
            )
            is_valid = True
        except InvalidSignature:
            is_valid = False
        
        print(f"Verification Status: {'SUCCESS' if is_valid else 'FAILURE'}")
        print("--------------------------")

    # Enqueue tasks
    task_queue.put({'query': 'mathematics', 'callback': handle_result})
    task_queue.put({'query': 'physics', 'callback': handle_result})
    task_queue.put({'query': 'history', 'callback': handle_result})

    # Wait for tasks to complete
    task_queue.join()
    time.sleep(0.5) # Give time for final logging
    scheduler.stop()
    scheduler.join()
