import logging
import os
from typing import Optional

# Configure specific logger
logging.basicConfig(level=logging.INFO, format='%(levelname)s:CSR_PVL:%(message)s')

class CSRPersistenceLayer:
    """
    Manages the persistence, retrieval, and verification of the Config State Root (CSR).
    This establishes the Root of Trust for subsequent DSE phases.
    """
    
    CSR_ROOT_FILE = '.csr_root'
    
    def __init__(self, root_directory: str = '.'):
        self._path = os.path.join(root_directory, self.CSR_ROOT_FILE)
        
    def write_csr(self, csr_hash: str) -> None:
        """Writes the computed CSR hash to an immutable artifact file."""
        try:
            # Ensure directory exists before writing
            os.makedirs(os.path.dirname(self._path) or '.', exist_ok=True)
            
            with open(self._path, 'w', encoding='utf-8') as f:
                f.write(csr_hash.strip())
            logging.info(f"CSR successfully persisted to {self._path}")
        except IOError as e:
            logging.critical(f"Failed to write CSR to file: {e}")
            raise

    def read_csr(self) -> Optional[str]:
        """Retrieves the currently persisted CSR hash."""
        if not os.path.exists(self._path):
            logging.warning("CSR root file not found. System is uninitialized.")
            return None
            
        try:
            with open(self._path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except IOError as e:
            logging.error(f"Failed to read CSR from file: {e}")
            return None
            
    def verify_csr(self, current_hash: str) -> bool:
        """Compares a newly generated hash against the persisted root hash."""
        persisted_hash = self.read_csr()
        if persisted_hash is None:
            logging.error("Cannot verify: No persisted CSR root exists.")
            return False
            
        is_valid = (persisted_hash == current_hash.strip())
        if is_valid:
            logging.info("CSR verification successful. State root matches persistence.")
        else:
            logging.critical(f"CSR verification FAILED! Persisted: {persisted_hash[:16]}... Current: {current_hash[:16]}...")
        
        return is_valid
