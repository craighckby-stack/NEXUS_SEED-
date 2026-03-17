import hashlib
import json
import os
# Assumption: A 'security' module provides cryptographic signing capabilities
# from security import SignerService 

def load_tbr(tbr_path="config/TBR.json"):
    """Loads the list of configuration files to be hashed."""
    # Placeholder: TBR structure definition assumed
    # In a real system, path definition/loading is hardened.
    if not os.path.exists(tbr_path):
        raise FileNotFoundError(f"TBR file not found: {tbr_path}")
        
    try:
        with open(tbr_path, 'r') as f:
            # Assumes TBR provides a list under 'critical_paths'
            data = json.load(f)
            return data.get("critical_paths", [])
    except json.JSONDecodeError:
        raise ValueError("Invalid TBR structure.")

def generate_aggregate_hash(file_paths):
    """Calculates the deterministic aggregate hash (M-Hash) based on sorted artifact content."""
    sha512 = hashlib.sha512()
    
    # Hashing stability is paramount: paths must be sorted lexicographically
    sorted_paths = sorted(file_paths)
    
    for path in sorted_paths:
        if not os.path.exists(path):
            raise FileNotFoundError(f"TBR referenced critical file missing: {path}")
        
        # Hash file content in blocks (binary mode)
        with open(path, 'rb') as f:
            while chunk := f.read(4096):
                sha512.update(chunk)
                
    return sha512.hexdigest()

def create_manifest(output_path="manifest/G0-Policy_Manifest.sig", tbr_path="config/TBR.json"):
    """Generates the signed manifest file ($T_{0}$ baseline)."""
    try:
        print("\n[PMG] Starting $T_{0}$ Manifest generation...")
        critical_files = load_tbr(tbr_path)
        m_hash = generate_aggregate_hash(critical_files)
        
        manifest_data = {
            "version": "3.0",
            "m_hash": m_hash,
            "hash_algorithm": "SHA-512",
            "artifact_count": len(critical_files),
            "timestamp": "SYSTEM_GOVERNANCE_TIMESTAMP" # To be replaced by secure time source
        }

        # --- SECURITY INTEGRATION POINT ---
        # signature = SignerService.get_instance("GOV_KEY_STORE").sign(json.dumps(manifest_data))
        signature = "GOVERNANCE_SIGNATURE_PLACEHOLDER" # Placeholder for security module integration

        final_manifest = {
            "metadata": manifest_data,
            "signature": signature
        }

        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(final_manifest, f, indent=2)
            
        print(f"[PMG] SUCCESS: Manifest created for {len(critical_files)} artifacts at {output_path}.")
        
    except Exception as e:
        print(f"[PMG] CRITICAL FAILURE generating manifest: {e}")
        exit(1)

if __name__ == "__main__":
    # This script runs during the hardened build phase, not runtime.
    create_manifest()