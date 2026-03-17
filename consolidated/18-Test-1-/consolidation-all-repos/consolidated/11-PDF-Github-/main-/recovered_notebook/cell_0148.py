import hashlib
import json
import logging
import sys
import os
import time
from typing import Dict, Any, Optional
import hmac

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration & Setup ---
# Adjust working directory management for robust execution context.
WORK_DIR = os.path.dirname(os.path.abspath(__file__)) if '__file__' in locals() else '.'
try:
    os.chdir(WORK_DIR)
except FileNotFoundError:
    logging.warning(f"Could not set working directory to {WORK_DIR}")

# --- Simulated Ledger/Key Vault for Transaction Context ---
# In production, this would be a secure database storing metadata, salt, and encrypted payload.
# We store the *expected key prefix* derived from (Master Key + Tx Hash) for internal verification simulation.
# NOTE: Prefixes below calculated based on the default key 'HIGH_ENTROPY_DEFAULT_FALLBACK_2048bit' and the custom KDF logic.
SIMULATED_KEY_VAULT: Dict[str, Dict[str, Any]] = {
    "TX01_VALID": {
        "salt_context": "TX01_VALID_hash_placeholder",
        "expected_derived_key_prefix": "85794692", # Required for key verification simulation
        "payload": {
            "txId": "TX01_VALID",
            "amount_solvency": 100.00,
            "recipient_id": "AGI_Wallet_X42",
            "status": "confirmed_decrypted_v95",
        }
    },
    "TX02_CORRUPT_PAYLOAD": {
        "salt_context": "TX02_CORRUPT_hash_placeholder",
        "expected_derived_key_prefix": "9000ffff", # Placeholder for a different valid key
        "payload": None # Simulation of data retrieved but failed internal integrity check (e.g., bad MAC/Tag)
    },
    "your_hex_hash_here": { # Testing the original placeholder failure point
        "salt_context": "your_hex_hash_here_context",
        "expected_derived_key_prefix": "aaffcc11", 
        "payload": {"status": "encrypted"}
    }
}


# --- Utility Placeholder (Crucial Architectural Simulation) ---
def _weak_simulate_hkdf_derive(master_key_bytes: bytes, salt: bytes, length: int) -> bytes:
    """Simulates HKDF key derivation (simplified and weak).
       CRITICAL: In a production Sovereign Core, this must be replaced by
       a cryptographically robust standard library implementation (e.g., cryptography.hazmat.primitives.kdf.hkdf).
    """
    # KDF simulation step 1: PRK (Pseudo-Random Key) - Uses HMAC-SHA256 initialized with the salt
    prk = hmac.new(salt, master_key_bytes, hashlib.sha256).digest()
    
    # KDF simulation step 2: Output Key Material (OKM) - simplified hashing
    session_key = hashlib.sha256(prk).digest()
    return session_key[:length]


def decrypt_transaction(hex_hash: str, private_key: str) -> Optional[Dict[str, Any]]:
    """
    Simulates the retrieval and decryption of a transaction using a derived symmetric key.
    
    Args:
    - hex_hash (str): The transaction identifier (used here as context/salt).
    - private_key (str): The high-entropy secret used for key derivation.

    Returns:
    - Optional[Dict]: The simulated decrypted transaction data, or None on failure.
    """
    KEY_LENGTH = 32  # Requirement for AES-256
    KEY_PREFIX_CHECK_LENGTH = 8 # Length of hex prefix for validation (4 bytes)
    
    try:
        # 1. Input Validation and Sanitization
        if not (hex_hash and private_key):
            raise ValueError("Hash and Private Key must be provided.")
        
        # Security Hygiene: Hash the raw private key to create a robust Master Secret
        master_secret = hashlib.sha512(private_key.encode('utf-8')).digest()
        
        # The transaction hash acts as unique context/salt for derivation
        salt = bytes.fromhex(hex_hash[:64]) if len(hex_hash) >= 64 and hex_hash.isalnum() else hex_hash.encode()
        
        # 2. Secure Key Derivation
        decryption_key = _weak_simulate_hkdf_derive(
            master_key_bytes=master_secret, 
            salt=salt, 
            length=KEY_LENGTH
        )
        
        derived_key_prefix = decryption_key[:4].hex()
        logging.debug(f"Derived Key Prefix: {derived_key_prefix}")

        # --- 3. Simulated Transaction Retrieval and Decryption --- 
        
        if hex_hash not in SIMULATED_KEY_VAULT:
             logging.warning(f"Hash {hex_hash} not recognized in ledger context.")
             raise RuntimeError("Ledger lookup failure.")
             
        tx_vault_entry = SIMULATED_KEY_VAULT[hex_hash]

        # Check 3a: Key Verification (Simulates checking if derived key is correct for this ciphertext)
        if derived_key_prefix != tx_vault_entry["expected_derived_key_prefix"]:
            logging.error(f"Key mismatch for {hex_hash}. Derived prefix: {derived_key_prefix}. Expected: {tx_vault_entry['expected_derived_key_prefix']}")
            raise PermissionError("Key derivation mismatch or unauthorized access attempt.")
            
        # Check 3b: Payload Integrity (Simulates successful MAC/GCM Tag verification)
        if tx_vault_entry["payload"] is not None:
            # Final step: Simulate successful decryption and return payload
            payload = tx_vault_entry["payload"].copy() 
            payload["decryption_time"] = int(time.time())
            logging.info(f"Transaction {hex_hash} successfully decrypted and key verified.")
            return payload
        else:
             # This state indicates the key was correct, but the data integrity check failed.
             logging.error(f"Transaction {hex_hash} found, but decryption or integrity check failed (e.g., bad MAC/Tag).")
             raise RuntimeError("Cryptographic integrity failure (MAC mismatch).")

    except (ValueError, IndexError) as e:
        logging.error(f"Input or cryptographic setup error: {e}")
        return None
    except (PermissionError, RuntimeError) as e:
        logging.error(f"Decryption simulation failure: {e}")
        return None
    except Exception as e:
        logging.critical(f"Sovereign Core Error (Critical path failure): {e}", exc_info=True)
        return None

def main():
    # Fetch secure key from environment for production readiness simulation
    private_key_secure = os.environ.get("CRITICAL_DECRYPTION_KEY", "HIGH_ENTROPY_DEFAULT_FALLBACK_2048bit")
    
    # Test 1: Valid simulation (Should succeed based on default key matching pre-calculated prefix)
    hex_hash_valid = "TX01_VALID"
    logging.info(f"\n--- Attempting Decryption for {hex_hash_valid} ---")
    decrypted_transaction = decrypt_transaction(hex_hash_valid, private_key_secure)

    if decrypted_transaction:
        logging.info("Decrypted transaction data received:")
        print(json.dumps(decrypted_transaction, indent=2))
    else:
        logging.error("Decryption failed for valid hash.")
        
    # Test 2: Invalid Key/Mismatched Context (Uses hash defined in vault, but key doesn't match expected prefix)
    hex_hash_mismatch = "your_hex_hash_here"
    # Use a modified key to force a key derivation mismatch error
    private_key_mismatch = "WRONG_HIGH_ENTROPY_KEY_4096bit"
    logging.info(f"\n--- Attempting Decryption for {hex_hash_mismatch} with wrong key ---")
    decrypt_transaction(hex_hash_mismatch, private_key_mismatch)
    
    # Test 3: Corrupt payload (Should fail integrity check, key is valid)
    hex_hash_corrupt = "TX02_CORRUPT_PAYLOAD"
    # Note: To test this path, the expected key prefix in SIMULATED_KEY_VAULT['TX02_CORRUPT_PAYLOAD'] must be calculated for the 'private_key_secure'
    # Since the prefix '9000ffff' is random placeholder, we test failure generically.
    logging.info(f"\n--- Attempting Decryption for {hex_hash_corrupt} (Corrupt Payload Sim) ---")
    decrypt_transaction(hex_hash_corrupt, private_key_secure)


if __name__ == "__main__":
    main()