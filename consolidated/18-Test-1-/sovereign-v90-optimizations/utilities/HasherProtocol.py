import hashlib
import os
from typing import Optional

class HashAlgorithm:
    """Standardized cryptographic hashing algorithms used by GAX protocols."""
    SHA256 = 'sha256'
    SHA512 = 'sha512'

class CodeArtifactHasher:
    """
    Protocol handler for generating consistent, reproducible hashes for 
    code artifacts, models, or data bundles prior to Cryptographic Attestation 
    (CAPR registration).

    This ensures that artifacts presented to CAPR for sealing have been hashed
    using a GAX-mandated, deterministic algorithm.
    """
    
    def __init__(self, algorithm: str = HashAlgorithm.SHA256):
        if algorithm not in [HashAlgorithm.SHA256, HashAlgorithm.SHA512]:
            raise ValueError(f"Unsupported hashing algorithm: {algorithm}")
        self.algorithm = algorithm

    def hash_file(self, filepath: str, chunk_size: int = 4096) -> Optional[str]:
        """Calculates the hash for a single large file, optimized for memory."""
        if not os.path.exists(filepath):
            return None

        hasher = hashlib.new(self.algorithm)
        try:
            with open(filepath, 'rb') as f:
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    hasher.update(chunk)
            return hasher.hexdigest()
        except IOError:
            # File system error during read (High severity) 
            return None 
