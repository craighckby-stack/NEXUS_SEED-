# ESVS Baseline Manifest Generator
# Role: Utility script run during controlled staging/deployment to establish an immutable environmental signature.

import json
import os
import sys
from pathlib import Path

# Assuming ESVS is importable from the services directory
# Adjust import based on the actual project structure if necessary
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent.parent
sys.path.append(str(project_root))

from services.esvs.environmental_signature_verifier import ESVS, DEFAULT_MANIFEST_PATH, CORE_SIG_KEY

def generate_and_save_baseline(manifest_path: Path):
    """Generates the baseline manifest data and atomically writes it to disk."""
    print("\n--- ESVS Baseline Generator Initializing ---")
    print(f"Target Manifest Path: {manifest_path}")

    # Use a dummy ESVS instance purely for generation (it will attempt to load the old manifest, but we only need the generator method)
    # NOTE: In a true greenfield scenario, this requires handling the FileNotFoundError gracefully.
    try:
        esvs_instance = ESVS(manifest_path=manifest_path)
        manifest_data = esvs_instance.generate_baseline_manifest()

        # Output structure confirmation
        if CORE_SIG_KEY not in manifest_data:
            raise RuntimeError("Failed to generate core signature data.")

        # Prepare for atomic write
        temp_path = manifest_path.with_suffix('.tmp')
        
        # Use pretty printing for human review during setup, unlike the canonical hashing used internally
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=4, ensure_ascii=False)

        # Atomically replace the manifest (safe write)
        os.rename(temp_path, manifest_path)

        print(f"[SUCCESS] Baseline signature generated: {manifest_data[CORE_SIG_KEY][:12]}...")
        print(f"Baseline written successfully to {manifest_path}")

    except Exception as e:
        print(f"[FATAL ERROR] Cannot establish trusted ESVS baseline: {e}")
        sys.exit(1)

if __name__ == '__main__':
    # Ensure the registry directory exists before writing
    DEFAULT_MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    generate_and_save_baseline(DEFAULT_MANIFEST_PATH)
