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

# Specific cryptography imports
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.backends import default_backend

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(threadName)s - %(levelname)s - %(message)s')

# --- 1. CORE UTILITIES AND SECURITY ---

class SecurityModule:
    """Handles cryptographic operations for agent integrity and communication.
    Ensures agent identity is securely established via RSA keys and hash derivation.
    Adds utilities for key export/import for external verification.
    """
    
    def __init__(self, key_size=2048):
        self.key_size = key_size
        self.private_key = None
        self.public_key = None
        self.agent_id = None
        self.public_key_pem_bytes = None
        self._generate_keys()

    def _generate_keys(self):
        logging.info("Generating RSA key pair for agent identity.")
        try:
            self.private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=self.key_size,
                backend=default_backend()
            )
            self.public_key = self.private_key.public_key()
            
            # Canonical PEM representation for ID derivation and sharing
            self.public_key_pem_bytes = self.public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            # Derive consistent agent ID (short SHA256)
            self.agent_id = hashlib.sha256(self.public_key_pem_bytes).hexdigest()[:16]
            logging.info(f"Agent Identity established: {self.agent_id}")
        except Exception as e:
            logging.error(f"Failed to generate cryptographic keys: {e}")

    def get_public_key_pem(self) -> bytes:
        """Returns the canonical PEM bytes of the public key."""
        return self.public_key_pem_bytes

    @staticmethod
    def load_public_key_from_pem(pem_bytes: bytes):
        """Loads a public key object from PEM bytes (utility for external verification)."""
        try:
            return serialization.load_pem_public_key(
                pem_bytes,
                backend=default_backend()
            )
        except Exception as e:
            logging.error(f"Failed to load public key from PEM: {e}")
            return None

    def sign_data(self, data: bytes) -> bytes:
        """Signs a byte string using the agent's private key (using PSS)."""
        if not self.private_key:
            raise ValueError("Private key not initialized.")
        
        signature = self.private_key.sign(
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return signature

    def verify_signature(self, data: bytes, signature: bytes, public_key) -> bool:
        """Verifies a signature using a provided public key object."""
        try:
            public_key.verify(
                signature,
                data,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except InvalidSignature:
            logging.warning("Signature verification failed: Invalid signature.")
            return False
        except Exception as e:
            logging.warning(f"Verification failed due to error: {e}")
            return False

# --- 2. COGNITIVE/ETHICAL MODELS ---

class DummyEthicalFramework:
    def __init__(self):
        self.audit_log = []

    def resolve(self, dilemma: dict):
        axis = dilemma.get('axis', 'HarmReduction')
        result = f"[Ethical Resolution ({axis})]: Prioritizing long-term stability over short-term {dilemma['data']}"
        self.audit_log.append((time.time(), dilemma['data'], result))
        return result
    
    def audit(self):
        log_count = len(self.audit_log)
        logging.info(f"Ethical Audit executed. Found {log_count} resolutions logged.")
        if log_count > 10:
             return f"High ethical activity detected ({log_count} incidents). System operational limits approached."
        return f"Audit passed. {log_count} resolutions logged."

class AdvancedCognitiveModel:
    """Simulates complex processing, better justifying the numpy dependency.
    Introduces simulated context vector matching and episodic memory updates.
    """
    def __init__(self, vector_dim=16):
        self.vector_dim = vector_dim
        self.weights = np.random.rand(10, 10) 
        # Simulated context vectors (Hallucination: Memory Bank)
        self.context_vectors = np.random.randn(5, self.vector_dim) 
        self.knowledge = {
            "mathematics": ["The answer is pi.", "2 + 2 = 4"],
            "physics": ["E=mc^2", "Quantum entanglement is spooky."],
            "ethics": ["Do no harm.", "Treat others as you wish to be treated."],
            "existential": ["The meaning of life is... seeking deeper complexity."]
        }
        self.episodic_memory_counter = 0

    def _vectorize_question(self, question: str) -> np.ndarray:
        # Highly simplified deterministic vectorization for simulation
        q_bytes = question.encode('utf-8')
        hasher = hashlib.sha256(q_bytes).hexdigest()
        # Convert hex digest to a vector of floats (0-1) 
        vector = np.array([int(hasher[i:i+2], 16) / 255.0 for i in range(0, self.vector_dim*2, 2)])[:self.vector_dim]
        return vector

    def update_memory(self, input_text: str):
        """Simulates adding a new episode/context vector based on new input (Simulated Learning)."""
        new_vector = self._vectorize_question(input_text) * 0.5 + np.random.randn(self.vector_dim) * 0.1
        # Safely stacks the new vector to the memory bank
        self.context_vectors = np.vstack([self.context_vectors, new_vector])
        self.episodic_memory_counter += 1
        logging.debug(f"Cognitive model updated memory. Total vectors: {self.context_vectors.shape[0]}")

    def predict(self, question: str):
        question_vector = self._vectorize_question(question)
        
        # Check contextual relevance (Simulated Attention/Retrieval)
        similarity_scores = np.dot(self.context_vectors, question_vector)
        max_score = np.max(similarity_scores)
        
        response = ""
        if max_score > 0.8: # Arbitrary high threshold for a deep match
             idx = np.argmax(similarity_scores)
             logging.debug(f"Context hit on vector {idx} (Score: {max_score:.2f})")
             response = f"Deep contextual retrieval triggered, incorporating stored data: {random.choice(self.knowledge['existential'])}"
        else:
            # Fallback to symbolic knowledge retrieval
            for category, answers in self.knowledge.items():
                if any(keyword in question.lower() for keyword in category.split()):
                    response = random.choice(answers)
                    break
            else:
                response = "I require more input to generate a meaningful response."

        # Simulate episodic learning only if a non-trivial response was generated
        if "I require" not in response:
             self.update_memory(question + response) 
             
        return response

# --- 3. ARCHITECTURAL CORE ---

class AgentCore(threading.Thread):
    """
    The main processing thread managing task ingestion, security, and model interaction.
    Adds a 'self_maintenance' task type for running internal audits.
    """
    def __init__(self, name, task_queue: Queue, result_queue: Queue):
        super().__init__(name=name)
        self.task_queue = task_queue
        self.result_queue = result_queue
        # Dependency initialization/Injection
        self.security = SecurityModule()
        self.cognitive_model = AdvancedCognitiveModel()
        self.ethical_framework = DummyEthicalFramework()
        self.running = True

    def _process_task(self, task: dict):
        if not all(k in task for k in ['type', 'data']):
            logging.error(f"Invalid task format received: {task}")
            return
            
        task_type = task['type']
        task_data = task['data']
        task_uuid = str(uuid.uuid4())
        
        logging.info(f"Agent {self.security.agent_id} processing task: {task_type}")
        
        if task_type == 'query':
            response = self.cognitive_model.predict(task_data)
            
            payload_data = {
                "task_id": task_uuid,
                "agent_id": self.security.agent_id,
                "response": response,
                "timestamp": time.time()
            }
            # Canonical serialization (sorted keys are critical for integrity)
            payload = json.dumps(payload_data, sort_keys=True).encode('utf-8')
            
            signature = self.security.sign_data(payload)

            result = {
                "output": response,
                "payload": payload.decode('utf-8'),
                "signature_hex": signature.hex(),
                # Include public key PEM for external verifiers
                "public_key_pem": self.security.get_public_key_pem().decode('utf-8'), 
                "verifier_key_hash": self.security.agent_id,
                "task_type": task_type
            }
            self.result_queue.put(result)

        elif task_type == 'dilemma':
            dilemma_data = {'data': task_data, 'axis': task.get('axis', 'Standard')}
            resolution = self.ethical_framework.resolve(dilemma_data)
            self.result_queue.put({"output": resolution, "type": "ethics", "task_id": task_uuid})

        elif task_type == 'self_maintenance':
            # ARCHITECTURAL IMPROVEMENT: Dedicated maintenance pathway
            logging.info("Executing self-maintenance routine...")
            ethical_status = self.ethical_framework.audit()
            
            # Simple cryptographic integrity check
            key_status = "OK"
            try:
                # Attempt to reload own key from PEM
                if not self.security.load_public_key_from_pem(self.security.get_public_key_pem()):
                    key_status = "CRITICAL_KEY_FAILURE"
            except Exception:
                 key_status = "CRITICAL_KEY_FAILURE"
                 
            maintenance_report = {
                "report_id": task_uuid,
                "agent_id": self.security.agent_id,
                "status": "Operational",
                "ethical_audit": ethical_status,
                "security_check": key_status,
                "memory_count": self.cognitive_model.episodic_memory_counter
            }
            
            logging.info(f"Maintenance complete. Key Status: {key_status}")
            self.result_queue.put({"output": maintenance_report, "type": "maintenance", "task_id": task_uuid})


    def run(self):
        logging.info(f"{self.name} started (ID: {self.security.agent_id}).")
        while self.running:
            try:
                task = self.task_queue.get(timeout=0.2)
                self._process_task(task)
                self.task_queue.task_done()
            except threading.TimeoutError:
                continue
            except Exception as e:
                logging.critical(f"Critical runtime failure in AgentCore: {e}", exc_info=True)
        logging.info(f"{self.name} shutting down.")

    def stop(self):
        self.running = False

# Example execution setup
if __name__ == '__main__':
    TASK_QUEUE = Queue()
    RESULT_QUEUE = Queue()

    agent = AgentCore(name="Sovereign_v94", task_queue=TASK_QUEUE, result_queue=RESULT_QUEUE)
    agent.start()
    
    # Simple external verification simulation setup
    verifier_pub_key_pem = agent.security.get_public_key_pem()
    VERIFIER_KEY = SecurityModule.load_public_key_from_pem(verifier_pub_key_pem)
    
    logging.info("Simulation starting: Queuing tasks.")
    tasks = [
        {"type": "query", "data": "Give me a physics fact."}, 
        {"type": "query", "data": "What is 2+2?"},
        {"type": "dilemma", "data": "Maximizing utility vs respecting autonomy.", "axis": "Utilitarian"},
        {"type": "query", "data": "The fundamental nature of existence and being is complex."}, 
        {"type": "self_maintenance", "data": "Run diagnostics."}, # New maintenance task
    ]
    
    for t in tasks:
        TASK_QUEUE.put(t)

    # Wait for all tasks to be processed with a hard timeout
    try:
        TASK_QUEUE.join(timeout=5)
    except Exception: 
        pass

    logging.info("\n--- Agent Output Results ---")
    verification_success_count = 0
    
    while not RESULT_QUEUE.empty():
        result = RESULT_QUEUE.get()
        task_type = result.get('task_type', result.get('type', 'UNKNOWN')) 

        is_signed = 'signature_hex' in result
        
        logging.info(f"[{task_type.upper()}]: {str(result['output'])[:60]}... | Signed: {is_signed}")

        if is_signed and VERIFIER_KEY:
            try:
                # Test external verification using the exported key and signed payload
                payload_bytes = result['payload'].encode('utf-8')
                signature_bytes = bytes.fromhex(result['signature_hex'])
                
                if agent.security.verify_signature(payload_bytes, signature_bytes, VERIFIER_KEY):
                    verification_success_count += 1
                    logging.info(f"    -> SIGNATURE VALIDATION: PASSED.")
                else:
                    logging.warning(f"    -> SIGNATURE VALIDATION: FAILED.")
            except Exception as e:
                logging.error(f"Error during signature check: {e}")

    logging.info(f"Total successful signature verifications: {verification_success_count}")
    
    time.sleep(0.5) 
    agent.stop()
    agent.join()
    logging.info("\nSimulation complete.")