#!/usr/bin/env python
# src/core/pim/integrity_initializer.py: Mandated Pre-G0 Integrity Check Layer

import hashlib
import os 
from pathlib import Path
import logging
from typing import Union, Dict, Any

# NOTE: Assuming structured logging system (e.g., system_logger.py scaffold) is available.
# Using standard logging temporarily.
logger = logging.getLogger(__name__)

# --- Foundational Configuration ---
POLICY_NEXUS_PATH = Path('protocol/pgn_master.yaml')
CHECKSUM_ALGORITHM = 'sha256'
# 64 KB chunk size for efficient file hashing
CHUNK_SIZE = 65536 

class IntegrityVerificationError(Exception):
    """Custom exception signaling a failure during cryptographic integrity verification."""
    pass

class IntegrityInitializer:
    """
    Validates foundational configuration integrity (GAX, P-Set specs) 
    against the PGN (Policy Governance Nexus) checksums prior to activating 
    the PIM (G0 readiness).
    
    This layer is non-negotiable and must execute successfully before core activation.
    """
    
    def __init__(self, nexus_path: Path = POLICY_NEXUS_PATH):
        """Initializes the Integrity Initializer and loads the required PGN manifest."""
        self.nexus_path = nexus_path
        self.pgn_manifest: Dict[str, Any] = self._load_pgn_nexus()

    # --- PGN Nexus Management ---

    def _load_pgn_nexus(self) -> Dict[str, Any]:
        """
        Loads and securely parses the Policy Governance Nexus specification.
        
        CRITICAL SECURITY NOTE: In a production Sovereign AGI, this function 
        *must* integrate with a secure component (see: secure_policy_loader.py scaffold) 
        that performs signature verification and tamper checks on the policy file.
        """
        logger.info(f"Attempting to load PGN Nexus from: {self.nexus_path}")
        
        # --- TEMPORARY MOCK IMPLEMENTATION (Replace Immediately) ---
        try:
            # Structure required: 'checksums': { filepath: 'alg:hash', ... }
            return {
                'version': '1.1-PreG0',
                'description': 'Mandated core component integrity policy.',
                'checksums': {
                    'protocol/gax_master.yaml': f'{CHECKSUM_ALGORITHM}:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 
                    'protocol/cryptographic_manifest.json': f'{CHECKSUM_ALGORITHM}:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210', 
                }
            }
        except Exception as e:
            # If mocking fails (highly unlikely) or real implementation hits an error.
            raise IntegrityVerificationError(f"Failed to securely load PGN Nexus: {e}")
        # -----------------------------------------------------------


    # --- Checksum Utilities ---

    @staticmethod
    def calculate_checksum(filepath: Union[str, Path], algorithm: str = CHECKSUM_ALGORITHM) -> str:
        """
        Calculates the specified hash for a given file path using chunk reading.
        Returns hash in format 'algorithm:hexdigest'.
        """
        file_path = Path(filepath)
        
        if not file_path.is_file():
            raise FileNotFoundError(f"Mandatory configuration file missing: {file_path}")
        
        try:
            h = hashlib.new(algorithm)
            
            with file_path.open('rb') as f:
                while chunk := f.read(CHUNK_SIZE):
                    h.update(chunk)
            
            return f"{algorithm}:{h.hexdigest()}"
        except OSError as e:
            raise IntegrityVerificationError(f"I/O error during hash calculation for {file_path}: {e}")

    # --- Main Execution ---

    def run_preflight_check(self) -> bool:
        """Executes the mandated Pre-G0 integrity audit."""
        
        if not self.pgn_manifest.get('checksums'):
            logger.critical("PGN Manifest loaded but is empty or lacks 'checksums' key.")
            raise IntegrityVerificationError("Invalid PGN Policy Structure.")

        logger.info(f"Executing foundational integrity audit (Version: {self.pgn_manifest['version']}).")
        
        integrity_ok = True
        failed_checks = []
        
        for relative_path_str, mandated_hash in self.pgn_manifest['checksums'].items():
            relative_path = Path(relative_path_str)
            
            try:
                current_hash = self.calculate_checksum(relative_path)
                
                if current_hash != mandated_hash:
                    integrity_ok = False
                    error_detail = (
                        f"Checksum Mismatch: {relative_path}. "
                        f"Expected: {mandated_hash}, Actual: {current_hash}"
                    )
                    logger.error(error_detail)
                    failed_checks.append(error_detail)
                else:
                    logger.debug(f"Validated OK: {relative_path}")
                
            except (FileNotFoundError, IntegrityVerificationError) as e:
                # Immediate critical failure if a file is missing or unreadable
                error_msg = f"CRITICAL INIT FAILURE: Mandatory component check failed for {relative_path.name}. Reason: {e}"
                logger.critical(error_msg)
                raise SystemExit(error_msg) 

        if not integrity_ok:
            error_msg = f"FATAL: Pre-G0 integrity breach detected. Failed Checks: {len(failed_checks)}. System cannot proceed."
            logger.critical(error_msg)
            raise SystemExit(error_msg)
        
        logger.info("Foundational Integrity Passed (G0 Ready).")
        return True

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG, format='[INIT_STANDALONE] %(levelname)s: %(message)s')
    pass