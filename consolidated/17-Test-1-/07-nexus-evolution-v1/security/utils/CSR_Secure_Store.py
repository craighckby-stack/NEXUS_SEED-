# security/utils/CSR_Secure_Store.py

import json
import os
from typing import Dict, Any

# NOTE: Assuming dependency on existing CRoT utilities
from utilities.CRoT_CSR_Generator import generate_csr_manifest, CRITICAL_CONFIG_FILES, CRoTError 

TRUSTED_MANIFEST_PATH = "security/trusted/CSR_MANIFEST.json"
TRUSTED_DIRECTORY = os.path.dirname(TRUSTED_MANIFEST_PATH)

def _ensure_trusted_dir():
    """Ensures the trusted security directory exists with appropriate permissions (conceptually)."""
    if not os.path.exists(TRUSTED_DIRECTORY):
        os.makedirs(TRUSTED_DIRECTORY, exist_ok=True)
        # NOTE: Implement security hardening (e.g., restricted access) here in deployment

def secure_store_manifest(manifest_json: str) -> None:
    """
    Atomically writes a CSR manifest to the trusted storage location.
    
    This is a highly privileged operation used to establish or update the trusted baseline.
    
    Args:
        manifest_json: The generated JSON string of the CSR.
        
    Raises:
        CRoTError: If storage fails due to I/O or generation issues.
    """
    _ensure_trusted_dir()
    
    # Use temporary file and rename for atomic write protection
    temp_path = TRUSTED_MANIFEST_PATH + ".tmp"
    try:
        data = json.loads(manifest_json)
        
        if data.get("root_hash") == "FAILURE_CRITICAL_INTEGRITY_CHECK":
             raise CRoTError("Cannot store manifest: Source generation failed integrity checks.")

        with open(temp_path, 'w') as f:
            json.dump(data, f, indent=4)
        
        # Atomic replacement
        os.replace(temp_path, TRUSTED_MANIFEST_PATH)
        # NOTE: Set file permissions to read-only for system processes
        
        print(f"[CSR_STORE] Success: New trusted baseline stored at {TRUSTED_MANIFEST_PATH}.")
        
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise CRoTError(f"Failed to securely store CSR manifest: {e}")

def bootstrap_initial_csr() -> bool:
    """Generates the current system state and sets it as the trusted baseline."""
    print("--- Running Initial CSR Bootstrap ---")
    try:
        current_csr_json = generate_csr_manifest(CRITICAL_CONFIG_FILES)
        secure_store_manifest(current_csr_json)
        return True
    except CRoTError as e:
        print(f"[CSR_STORE] Fatal failure during initialization: {e}")
        return False

if __name__ == '__main__':
    bootstrap_initial_csr()