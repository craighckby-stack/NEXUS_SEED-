import hashlib
import os
import json
from typing import Dict, List, Tuple, Any

class RETVError(Exception):
    """Custom exception for RETV validation failures."""
    pass

class RETV:
    """
    Runtime Environment Trust Validator (RETV).
    Verifies host integrity and committed artifact provenance immediately prior
    to L6 deployment execution, preventing supply-chain risk and environment drift.
    
    A successful validation ensures that the execution environment (Host Integrity) 
    and the deployed software (Artifact Provenance) match the secure L5 baseline.
    """
    
    # Static parameters for environment fingerprint calculation
    DEFAULT_ENV_COMPONENTS = [
        os.getenv('SYSTEMROOT', '/'),  
        os.uname().nodename,
        os.getenv('SHELL', '/bin/sh'),
    ]

    def __init__(self, 
                 l5_commit_metadata: Dict[str, Any], 
                 required_env_signature: str,
                 env_baseline_config: Dict[str, List[str]]):
        """
        :param l5_commit_metadata: Metadata from L5 commit, including artifact hashes (e.g., {'l6_artifacts': {'/path/to/deploy': 'hash'}}).
        :param required_env_signature: The known, secure baseline hash for the execution environment.
        :param env_baseline_config: Configuration detailing critical paths to include in the signature calculation.
        """
        self.l5_metadata = l5_commit_metadata
        self.required_env_signature = required_env_signature
        self.env_baseline_config = env_baseline_config
        self.integrity_report: List[Dict[str, Any]] = []

    def _calculate_hash(self, data: str) -> str:
        """Helper to calculate SHA256 hash."""
        return hashlib.sha256(data.encode()).hexdigest()

    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculates SHA256 hash for a specific file, raises RETVError on failure."""
        if not os.path.exists(file_path):
            self.integrity_report.append({
                "check": f"File Presence ({file_path})",
                "status": "FAIL",
                "reason": "Required file missing from execution path."
            })
            raise RETVError(f"Required file not found: {file_path}")

        try:
            hasher = hashlib.sha256()
            # Use chunks for reliable hashing of larger files
            with open(file_path, 'rb') as f:
                while chunk := f.read(4096):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            self.integrity_report.append({
                "check": f"File Hashing ({file_path})",
                "status": "FAIL",
                "reason": f"Error accessing or hashing file: {type(e).__name__}"
            })
            raise RETVError(f"Failed to hash file {file_path}")

    def _get_current_system_signature(self) -> str:
        """
        Generates a robust, aggregated environment signature based on:
        1. Default environment components.
        2. Checksums of critical files defined in the baseline configuration.
        """
        signature_components = []

        # 1. Base components
        signature_components.extend(self.DEFAULT_ENV_COMPONENTS)

        # 2. File checksum components (Deep environment validation)
        critical_paths = self.env_baseline_config.get('critical_paths', [])
        
        # We sort paths to ensure deterministic signature generation
        for path in sorted(critical_paths):
            try:
                file_hash = self._calculate_file_hash(path)
                signature_components.append(file_hash)
            except RETVError:
                # If required files fail to hash, the environment is fundamentally untrustworthy
                return "COMPROMISED_ENVIRONMENT_FAILURE" 
        
        # Aggregate all components into a single deterministic signature
        aggregated_string = "|".join(map(str, signature_components))
        return self._calculate_hash(aggregated_string)

    def _verify_system_alignment(self) -> bool:
        """Checks the current host environment signature against the required secure baseline."""
        try:
            current_sig = self._get_current_system_signature()
        except RETVError:
            current_sig = "INTERNAL_ERROR_DURING_GENERATION"
            
        status = current_sig == self.required_env_signature
        
        self.integrity_report.append({
            "check": "Host Environment Signature Alignment",
            "status": "PASS" if status else "FAIL",
            "required_sig_prefix": self.required_env_signature[:10],
            "actual_sig_prefix": current_sig[:10],
            "reason": "Baseline match confirmed." if status else "Configuration drift or critical file alteration detected."
        })
        return status

    def _verify_artifact_provenance(self) -> bool:
        """Validates critical L6 deployment artifact hashes against committed L5 metadata."""
        
        expected_artifacts = self.l5_metadata.get('l6_artifacts', {})
        overall_status = True

        if not expected_artifacts:
            self.integrity_report.append({"check": "Artifact Provenance", "status": "WARN", "reason": "No L6 artifacts defined in L5 metadata for validation."})
            return True 

        for artifact_path, expected_hash in expected_artifacts.items():
            try:
                actual_hash = self._calculate_file_hash(artifact_path)
            except RETVError:
                overall_status = False
                continue 

            if actual_hash != expected_hash:
                overall_status = False
                self.integrity_report.append({
                    "check": f"Artifact Provenance Check: {artifact_path}",
                    "status": "FAIL",
                    "reason": "Hash mismatch detected. Possible artifact tampering post-L5."
                })
            else:
                self.integrity_report.append({
                    "check": f"Artifact Provenance Check: {artifact_path}",
                    "status": "PASS",
                    "reason": "Artifact hash verified."
                })
        
        return overall_status

    def validate_runtime_trust(self) -> Tuple[bool, List[Dict[str, Any]]]:
        """Runs all critical runtime integrity checks."""
        self.integrity_report = []

        # Phase 1: Host Integrity Check (Must pass before deploying code)
        system_ok = self._verify_system_alignment()
        
        if not system_ok:
            print("RETV CRITICAL FAILURE: Host Integrity Deficit Detected. Triggering RCD protocol.")
            return False, self.integrity_report

        # Phase 2: Artifact Provenance Check
        artifact_ok = self._verify_artifact_provenance()
        
        overall_status = system_ok and artifact_ok
        
        if not overall_status:
            print("RETV CRITICAL FAILURE: Artifact Trust Deficit Detected. Triggering RCD protocol.")
        
        return overall_status, self.integrity_report
