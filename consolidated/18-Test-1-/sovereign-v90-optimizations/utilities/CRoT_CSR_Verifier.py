# utilities/CRoT_CSR_Verifier.py
import json
import logging
import os
from typing import Dict, Any

# Assuming CRoTError and required constants/generators are imported from the designated utility
from utilities.CRoT_CSR_Generator import generate_csr_manifest, CRITICAL_CONFIG_FILES, CRoTError

# -- Configuration ---
TRUSTED_MANIFEST_PATH = "security/trusted/CSR_MANIFEST.json"
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_stored_csr(path: str = TRUSTED_MANIFEST_PATH) -> Dict[str, Any]:
    """
    Loads the previously verified and securely stored Configuration State Report (CSR) manifest.
    
    This mechanism must ensure the file is loaded from a tamper-proof location (e.g., read-only
    partition, KMS secured storage) for verification purposes.
    
    Args:
        path: The file system path to the trusted CSR manifest.
        
    Returns:
        The trusted CSR dictionary.
        
    Raises:
        CRoTError: If the file cannot be read or is invalid JSON.
    """
    logger.info(f"Attempting to load trusted CSR from: {path}")
    try:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Trusted manifest file not found at {path}.")
            
        with open(path, 'r') as f:
            data = json.load(f)
            if not isinstance(data, dict) or 'root_hash' not in data:
                raise ValueError("Loaded manifest is structurally invalid.")
            return data
            
    except (FileNotFoundError, IOError, json.JSONDecodeError, ValueError) as e:
        # Fatal error during verification if the baseline cannot be accessed or is corrupt.
        raise CRoTError(f"Failed critical load of trusted CSR manifest: {e}")
    except Exception as e:
        # Catch unexpected errors (e.g., permission issues)
        raise CRoTError(f"Unexpected error during CSR loading: {type(e).__name__} - {e}")


def verify_system_integrity(stored_manifest_path: str = TRUSTED_MANIFEST_PATH) -> bool:
    """
    Compares the current configuration state against the trusted baseline CSR.
    
    The integrity check involves generating a fresh CSR based on critical files
    and comparing its cryptographic root hash against the securely stored baseline.
    
    Args:
        stored_manifest_path: Path to the trusted baseline CSR manifest.
        
    Returns:
        True if the current root hash matches the stored root hash (Integrity Verified), False otherwise.
    """
    logger.info("--- Starting CRoT Integrity Verification Process ---")
    try:
        # 1. Load Trusted Baseline
        trusted_manifest = load_stored_csr(stored_manifest_path)
        trusted_hash = trusted_manifest['root_hash']
        
        # 2. Generate Current State Report
        logger.info("Generating current configuration CSR...")
        current_csr_json = generate_csr_manifest(CRITICAL_CONFIG_FILES)
        current_manifest = json.loads(current_csr_json)
        
        # 3. Check for Generation Errors (Contract with Generator)
        if current_manifest.get("root_hash") == "FAILURE_CRITICAL_INTEGRITY_CHECK":
            logger.critical(
                f"Verification failed: CSR generation process reported internal failure: {current_manifest.get('error', 'Unknown Error')}"
            )
            return False

        current_hash = current_manifest['root_hash']

        # 4. Comparison
        if trusted_hash == current_hash:
            logger.info(f"[SUCCESS] System integrity verified. Root Hash: {trusted_hash[:16]}...")
            return True
        else:
            logger.critical("[FAILURE] CONFIGURATION TAMPERING DETECTED!")
            logger.critical(f"   Trusted Hash: {trusted_hash}")
            logger.critical(f"   Current Hash: {current_hash}")
            return False

    except CRoTError as e:
        logger.fatal(f"CRoT Verification failed fatally due to system/IO error: {e}")
        return False
    except Exception as e:
        logger.fatal(f"An unexpected exception occurred during verification: {type(e).__name__} - {e}")
        return False

if __name__ == "__main__":
    
    # Test requires the TRUSTED_MANIFEST_PATH file to exist.
    if verify_system_integrity():
        print("\nIntegrity Check OK.")
    else:
        print("\nIntegrity Check FAILED.")