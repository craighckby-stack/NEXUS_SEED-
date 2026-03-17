import time
import random
import logging
import uuid
import json
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.fernet import Fernet
import mpmath

# --- Configuration Section ---

# Set high initial precision globally (normalized to 60 for better stability)
mpmath.mp.dps = 60

# NOTE: Initial logging configuration remains
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(processName)s - %(message)s')

class RiemannHypothesisFalseError(Exception):
    """Raised when a non-trivial zero is found off the critical line (Re(s) != 0.5)."""
    pass

class SecureComputeUnit:
    """Manages secure key generation and data handling for high-stakes computations.
    Can be initialized with a pre-existing key (Master) or generate ephemeral keys (Worker).
    """
    def __init__(self, private_key=None):
        if private_key is None:
            # Worker unit: Generates ephemeral signing key
            self._private_key = rsa.generate_private_key(
                public_exponent=65537, key_size=3072, backend=default_backend()
            )
            self.is_master = False
        else:
            # Master unit: Uses provided key
            self._private_key = private_key
            self.is_master = True
            
        self._fernet_key = Fernet.generate_key()
        self.fernet = Fernet(self._fernet_key)

    def get_public_key_bytes(self):
        """Returns the public key serialized for verification."""
        return self._private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

    def verify_signature(self, data: str, signature: bytes, public_key_bytes: bytes) -> bool:
        """Verifies a signature against a given public key."""
        public_key = serialization.load_pem_public_key(public_key_bytes, backend=default_backend())
        try:
            public_key.verify(
                signature,
                data.encode('utf-8'),
                padding.PSS(mgf=padding.MGF1(hashes.SHA384()), salt_length=padding.PSS.MAX_LENGTH),
                hashes.SHA384()
            )
            return True
        except Exception:
            return False

    def sign_evidence(self, data: str) -> bytes:
        """Cryptographically signs critical findings."""
        return self._private_key.sign(
            data.encode('utf-8'),
            padding.PSS(mgf=padding.MGF1(hashes.SHA384()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA384()
        )

    def secure_log_progress(self, progress_data: dict, filename="progress.secure"):
        """Encrypts checkpoint data using Fernet before storage."""
        # Include the ephemeral Fernet key in the payload for decryption later
        progress_data['fernet_key'] = self._fernet_key.decode()
        json_data = json.dumps(progress_data)
        encrypted_data = self.fernet.encrypt(json_data.encode('utf-8'))
        with open(filename, 'wb') as f:
            f.write(encrypted_data)
        logging.debug(f"Secure progress logged by {'Master' if self.is_master else 'Worker'} to {filename}")

class ZetaZeroFinder:
    def __init__(self, tolerance=1e-18, max_steps=350, compute_unit: SecureComputeUnit = None, master_pub_key_pem: bytes = None):
        self.tolerance = tolerance
        self.max_steps = max_steps
        self.master_pub_key_pem = master_pub_key_pem
        
        # Initialize compute unit (Master provides pre-existing one, worker creates ephemeral)
        self.compute_unit = compute_unit if compute_unit else SecureComputeUnit()
        
        if os.environ.get('USE_OPT_MP', '0') == '1':
            logging.warning("Optimized Zeta function kernel usage detected.")

    @staticmethod
    def _zeta_function_wrapper(s):
        """Wrapper to ensure input is converted to high precision complex number."""
        return mpmath.zeta(mpmath.mpc(s))

    def calculate_zero(self, s):
        """Attempts to find a root (zero) of the Riemann Zeta function near s using robust methods."""
        try:
            # Switched solver to 'muller' which is generally robust for complex roots, tightened tolerance
            zero = mpmath.findroot(self._zeta_function_wrapper, s, 
                                   solver='muller', maxsteps=self.max_steps, 
                                   tol=self.tolerance)
            return zero
        except Exception as e:
            logging.warning(f"Root finding failed near s={s}. Error: {type(e).__name__}: {e}")
            return None

    def check_zero_location(self, zero, seed_imag):
        """Verifies if the found zero lies on the critical line (Re(s)=0.5)."""
        if zero is None: return
        
        real_part = zero.real
        
        if abs(real_part - 0.5) > self.tolerance * 10: # A slight margin for high precision noise
            zero_id = uuid.uuid4()
            
            # --- RH Falsification Event ---
            evidence_data = {
                "zero_id": str(zero_id),
                "timestamp": time.time(),
                "real_part": str(real_part),
                "imag_part": str(zero.imag),
                "seed_imag": float(seed_imag),
                "tolerance_used": self.tolerance,
            }
            log_message = json.dumps(evidence_data, indent=2)
            
            signature = self.compute_unit.sign_evidence(log_message)
            
            logging.critical(f"RH Falsified (ID: {zero_id}). Zero found off the critical line: Re={real_part}. Storing secure evidence.")

            # Store evidence securely, including signature and Master Pub Key for context
            evidence_data['status'] = "RH_FALSE"
            evidence_data['signature_hex'] = signature.hex()
            if self.master_pub_key_pem:
                 # Store master key reference for future verification against authority
                 evidence_data['master_pub_key_pem_hex'] = self.master_pub_key_pem.hex()

            self.compute_unit.secure_log_progress(
                evidence_data, 
                filename=f"evidence_{zero_id}.secure"
            )

            # Self-verification check
            if self.compute_unit.verify_signature(log_message, signature, self.compute_unit.get_public_key_bytes()):
                logging.critical("Self-verification of evidence signature SUCCESSFUL.")

            raise RiemannHypothesisFalseError(f"RH Falsified. Zero: {real_part} + {zero.imag}i")
        
        logging.info(f"Zero verified on critical line (Im={zero.imag:.12f}). Error margin: {abs(real_part - 0.5):.2e}")
        return zero

    def process_test_point(self, start_imag):
        """Handler for a single starting point on the imaginary axis (designed for parallel execution)."""
        mpmath.mp.dps = 60 
        seed_point = mpmath.mpc(0.5, start_imag)
        
        # Introduce minor perturbation to seed point in both dimensions for better robustness (Muller/Newton)
        perturbation = random.uniform(-1e-12, 1e-12)
        seed_point += mpmath.mpc(perturbation, perturbation * 0.1)

        logging.debug(f"Attempting calculation near t = {start_imag}")
        zero = self.calculate_zero(seed_point)
        
        if zero is not None:
            try:
                self.check_zero_location(zero, start_imag)
                return zero.imag
            except RiemannHypothesisFalseError:
                return None 
        return None


def worker_wrapper(finder_params, start_imag, master_pub_key_pem):
    """Wrapper function for ProcessPoolExecutor to handle initialization and logging."""
    # Worker initializes its own ephemeral SecureComputeUnit internally
    finder = ZetaZeroFinder(
        tolerance=finder_params['tolerance'], 
        max_steps=finder_params['max_steps'],
        master_pub_key_pem=master_pub_key_pem 
    )
    return finder.process_test_point(start_imag)


def test_zeros(start_imag, step_imag, max_zeros_to_find, max_workers=os.cpu_count()):
    """Systematically searches for non-trivial zeros using multiprocessing for high CPU utilization."""
    
    # 1. Initialize the authoritative Master Secure Compute Unit (Increased key size to 4096)
    master_signing_key = rsa.generate_private_key(
        public_exponent=65537, key_size=4096, backend=default_backend()
    )
    main_compute_unit = SecureComputeUnit(private_key=master_signing_key)
    # Serialize Master's Public Key to pass to workers for evidence context
    master_pub_key_pem = main_compute_unit.get_public_key_bytes()
    
    finder_params = {
        'tolerance': 1e-18, 
        'max_steps': 350, 
    }

    logging.info(f"Starting zero search from t={start_imag} with {max_workers} processes (ProcessPoolExecutor). DPS={mpmath.mp.dps}. Master Key Size: 4096.")
    
    current_imag = start_imag
    zeros_confirmed = []
    
    try:
        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            future_to_imag = {}
            
            # Seed the pool
            for i in range(max_workers * 2):
                if len(zeros_confirmed) >= max_zeros_to_find: break
                
                future = executor.submit(worker_wrapper, finder_params, current_imag, master_pub_key_pem)
                future_to_imag[future] = current_imag
                current_imag += step_imag

            # Dynamic result fetching and task submission
            for future in as_completed(future_to_imag):
                initial_imag = future_to_imag[future]
                
                try:
                    result_imag = future.result()
                    
                    if result_imag is not None:
                        zeros_confirmed.append(result_imag)
                        logging.info(f"[CONFIRMED] Zero {len(zeros_confirmed)} found at Im={result_imag:.12f}")

                    if len(zeros_confirmed) >= max_zeros_to_find:
                        logging.info("Target number of zeros reached. Shutting down pool.")
                        break
                        
                except RiemannHypothesisFalseError as e:
                    # Critical Failure caught from worker process
                    logging.fatal(f"MAIN THREAD ALERT: RH Falsification propagated. Immediate investigation required.")
                    
                    # Log the incident using the master unit's integrity systems
                    main_compute_unit.secure_log_progress({"master_incident": True, "error_summary": str(e)}, filename="CRITICAL_SHUTDOWN.secure")
                    
                    executor.shutdown(wait=False, cancel_futures=True)
                    raise e 
                except Exception as e:
                    logging.error(f"Unexpected execution error from task at t={initial_imag}: {type(e).__name__}: {e}")
                
                # Submit replacement task
                if len(zeros_confirmed) < max_zeros_to_find:
                    replacement_future = executor.submit(worker_wrapper, finder_params, current_imag, master_pub_key_pem)
                    future_to_imag[replacement_future] = current_imag
                    current_imag += step_imag

    except RiemannHypothesisFalseError:
        logging.fatal("SYSTEM HALT: Riemann Hypothesis Falsified.")
    except Exception as e:
        logging.error(f"Catastrophic overall execution failure: {e}")

    logging.info(f"Search finished. Total confirmed zeros: {len(zeros_confirmed)}.")