# Environmental Signature Verification Service (ESVS)
# Role: Proactively detect environmental drift before critical process initiation or during passive states.

import hashlib
import json
import os
import sys
from pathlib import Path

# Define specific error for clean catch handling upstream
class EnvironmentalDriftError(Exception):
    """Raised when the computed environmental signature does not match the expected manifest."""
    def __init__(self, runtime_sig: str, expected_sig: str, details: str = "Signature mismatch"):
        self.runtime_sig = runtime_sig
        self.expected_sig = expected_sig
        message = (
            f"ESVS_FAIL: Environmental Signature Drift Detected. IH Mandated. "
            f"Details: {details}. Runtime: {runtime_sig[:12]}... | Expected: {expected_sig[:12]}..."
        )
        super().__init__(message)

class ESVS:
    """
    Environmental Signature Verification Service (ESVS).
    Utilizes deterministic hashing of defined environmental checkpoints (DSE Checkpoint 0).
    """
    
    DEFAULT_MANIFEST_PATH = Path('registry/config/esvs_manifest.json')
    CORE_SIG_KEY = 'core_environment_v1'

    def __init__(self, manifest_path: Path = None):
        self.manifest_path = manifest_path if manifest_path else self.DEFAULT_MANIFEST_PATH
        self.expected_signatures = self._load_manifest()

    def _load_manifest(self) -> dict:
        """Loads and validates the integrity manifest, providing specific exceptions for I/O errors."""
        try:
            with open(self.manifest_path, 'r') as f:
                data = json.load(f)
            
            if self.CORE_SIG_KEY not in data:
                raise KeyError(f"Manifest '{self.manifest_path}' missing mandatory key: '{self.CORE_SIG_KEY}'.")
            
            return data

        except FileNotFoundError:
            raise FileNotFoundError(f"ESVS critical manifest not found at: {self.manifest_path}. Cannot guarantee baseline integrity.")
        except json.JSONDecodeError:
            raise ValueError(f"ESVS manifest corrupted (Invalid JSON) at: {self.manifest_path}.")


    def _get_os_data(self) -> dict:
        """Retrieves and normalizes deterministic OS metadata components."""
        try:
            # Use standard, stable environmental checkpoints. sys.version_info is highly deterministic.
            uname_info = os.uname()
            return {
                'os_system': uname_info.sysname,
                'os_kernel_release': uname_info.release,
                'system_architecture': uname_info.machine,
                'python_version': sys.version_info[:3], # Use tuple (major, minor, micro) for strict stability
            }
        except Exception as e:
            # Treat failure to retrieve critical OS data as immediate drift
            raise EnvironmentalDriftError("N/A", self.expected_signatures.get(self.CORE_SIG_KEY, 'UNKNOWN'), details=f"Failed to retrieve mandatory OS data: {e}")

    
    def _generate_runtime_signature(self) -> str:
        """
        Generates the SHA256 hash by deterministically serializing all critical data points.
        Using separators and sorted keys ensures hash consistency across execution runs.
        """
        # 1. Gather component data
        data = self._get_os_data()
        
        # 2. Serialize deterministically
        serialized_data = json.dumps(
            data, 
            sort_keys=True, 
            separators=(',', ':')
        )
        
        # 3. Hash
        return hashlib.sha256(serialized_data.encode('utf-8')).hexdigest()

    def verify_environment(self) -> bool:
        """Compares current environment signature against the immutable manifest."""
        runtime_sig = self._generate_runtime_signature()
        expected_sig = self.expected_signatures.get(self.CORE_SIG_KEY)
        
        if runtime_sig != expected_sig:
            # Raise structured, high-severity error for handling by the DSE controller
            raise EnvironmentalDriftError(
                runtime_sig=runtime_sig, 
                expected_sig=expected_sig
            )
            
        return True
