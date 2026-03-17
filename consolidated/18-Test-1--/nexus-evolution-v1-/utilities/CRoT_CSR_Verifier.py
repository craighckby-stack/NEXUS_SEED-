# utilities/CRoT_CSR_Verifier.py
import json
from typing import Dict, Any
from utilities.CRoT_CSR_Generator import generate_csr_manifest, CRITICAL_CONFIG_FILES, CRoTError

def load_stored_csr(path: str = "security/trusted/CSR_MANIFEST.json") -> Dict[str, Any]:
    """Simulates loading a previously verified and stored CSR manifest.
    Requires authorized read access to the trusted storage location.
    """
    try:
        # NOTE: Replace with actual secure read mechanism in production (e.g., KMS, secure enclave)
        # For simulation purposes:
        # with open(path, 'r') as f:
        #     return json.load(f)
        
        # Returning a placeholder dict since file access is simulated
        print(f"NOTE: Simulating trusted CSR load from {path}")
        return {"root_hash": "c7913501a35118749a4253181829e710b1a0be51b2a9557b7f14b301a0808a3e"}

    except Exception as e:
        raise CRoTError(f"Failed to load trusted CSR manifest: {e}")

def verify_system_integrity(stored_manifest_path: str = "security/trusted/CSR_MANIFEST.json") -> bool:
    """
    Compares the current configuration state against the trusted baseline CSR.
    
    Returns True if the current root hash matches the stored root hash.
    """
    print("\n--- Running CRoT Integrity Verification ---")
    try:
        trusted_manifest = load_stored_csr(stored_manifest_path)
        if not trusted_manifest or 'root_hash' not in trusted_manifest:
            print("Verification failed: Trusted baseline is invalid or missing.")
            return False

        # Generate the manifest for the current configuration state
        current_csr_json = generate_csr_manifest(CRITICAL_CONFIG_FILES)
        current_manifest = json.loads(current_csr_json)
        
        if current_manifest.get("root_hash") == "FAILURE_CRITICAL_INTEGRITY_CHECK":
            print(f"Verification failed: Current configuration failed integrity checks: {current_manifest.get('error')}")
            return False

        trusted_hash = trusted_manifest['root_hash']
        current_hash = current_manifest['root_hash']

        if trusted_hash == current_hash:
            print(f"[STATUS] SUCCESS: System integrity verified. Root Hash: {trusted_hash}")
            return True
        else:
            print(f"[STATUS] FAILURE: Configuration tampering detected!")
            print(f"   Trusted Hash: {trusted_hash}")
            print(f"   Current Hash: {current_hash}")
            return False

    except CRoTError as e:
        print(f"[FATAL] CRoT Verification encountered a fatal error: {e}")
        return False

if __name__ == "__main__":
    # Note: Requires coordination with generate_csr_manifest output for realistic testing
    verify_system_integrity()
