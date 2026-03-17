#!/usr/bin/env python3
import hashlib
import json
import os
import sys
import datetime
import time
from typing import Dict, Optional, List, Any

# Target system version, usually injected during build/deployment.
SYSTEM_VERSION = "v94.1_CHR_Lock"
ARTIFACT_REGISTRY_PATH = 'config/amgs_artifact_registry.json'
TARGET_MANIFEST_PATH = 'registry/chr_manifest.json'


def load_config(path: str) -> Optional[Any]:
    """Loads a JSON configuration file robustly, handling standard file and parsing errors."""
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"[FATAL] Required configuration file not found: {path}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"[FATAL] Configuration file {path} is invalid JSON: {e}", file=sys.stderr)
        return None
    except IOError as e:
        print(f"[FATAL] Error reading {path}: {e}", file=sys.stderr)
        return None


def get_governing_artifacts() -> Optional[List[str]]:
    """Loads the list of governing artifacts from the dedicated registry configuration."""
    registry = load_config(ARTIFACT_REGISTRY_PATH)
    if not registry:
        return None

    if 'governing_artifacts' not in registry or not isinstance(registry['governing_artifacts'], list):
        print(f"[FATAL] Artifact registry {ARTIFACT_REGISTRY_PATH} is improperly structured or missing the list.", file=sys.stderr)
        return None

    return registry['governing_artifacts']


def calculate_sha256(file_path: str) -> Optional[str]:
    """Calculates SHA256 hash for a given file path using buffered reading."""
    hasher = hashlib.sha256()
    buffer_size = 65536 # 64KB buffer maintained for I/O efficiency
    
    try:
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(buffer_size)
                if not chunk:
                    break
                hasher.update(chunk)
        return hasher.hexdigest()
    except (FileNotFoundError, IOError):
        # Consolidated error handling; specific error reporting is handled by the caller (generate_chr_manifest)
        return None


def generate_chr_manifest() -> bool:
    """
    Generates the Configuration Hash Registry (CHR) manifest.
    Returns True if successful, False otherwise.
    """
    
    governing_artifacts = get_governing_artifacts()
    if governing_artifacts is None:
        # Failure to load configuration handled by get_governing_artifacts
        return False

    # Use ISO 8601 standard for reliable, UTC timestamping
    generation_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    manifest: Dict = {
        "metadata": {
            "generation_time_utc": generation_time, 
            "system_version": SYSTEM_VERSION,
            "artifact_source": ARTIFACT_REGISTRY_PATH, 
            "lock_type": "AMGS_Sovereign_Integrity_Lock"
        },
        "artifacts": {}
    }
    
    missing_artifacts: List[str] = []
    
    print(f"--- AMGS Manifest Generator ({SYSTEM_VERSION}): Hashing Critical Artifacts ({len(governing_artifacts)} items) ---")
    
    for path in governing_artifacts:
        file_hash = calculate_sha256(path)
        
        if file_hash:
            manifest['artifacts'][path] = file_hash
        else:
            missing_artifacts.append(path)
            print(f"  [CRITICAL FAILURE] Missing/Unreadable artifact: {path}", file=sys.stderr)
            
    
    if missing_artifacts:
        print("\n[INTEGRITY FAILURE] CHR Generation Halted. System artifacts missing.")
        return False
    
    # Ensure the registry directory exists
    os.makedirs(os.path.dirname(TARGET_MANIFEST_PATH), exist_ok=True)
    
    try:
        # Lock the generated manifest
        with open(TARGET_MANIFEST_PATH, 'w') as f:
            json.dump(manifest, f, indent=4)
        
        print(f"\n[SUCCESS] CHR Manifest ({len(manifest['artifacts'])} artifacts) locked at: {TARGET_MANIFEST_PATH}")
        return True
    except IOError as e:
        print(f"[FATAL ERROR] Could not write manifest to {TARGET_MANIFEST_PATH}: {e}", file=sys.stderr)
        return False

if __name__ == '__main__':
    if not generate_chr_manifest():
        sys.exit(1)
    sys.exit(0)
