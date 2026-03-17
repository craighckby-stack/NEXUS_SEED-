import hashlib
import os
from typing import Union, List

class HashEngineError(Exception):
    """Base exception for Hashing Engine failures."""
    pass

class HashingEngine:
    """Standardized service for calculating cryptographically strong hashes 
    (e.g., SHA-256) of files, directories, or memory buffers, ensuring 
    consistent integrity checks across the system (G0/G2 phases)."""

    def __init__(self, algorithm: str = 'sha256', block_size: int = 65536):
        self.algorithm = algorithm
        self.block_size = block_size

    def _get_hasher(self):
        """Returns a new hashlib object for the configured algorithm."""
        try:
            return hashlib.new(self.algorithm)
        except ValueError:
            raise HashEngineError(f"Unsupported hashing algorithm: {self.algorithm}")

    def hash_file(self, file_path: str) -> str:
        """Calculates the hash of a file."""
        hasher = self._get_hasher()
        if not os.path.exists(file_path):
            raise HashEngineError(f"File not found: {file_path}")
            
        try:
            with open(file_path, 'rb') as f:
                while chunk := f.read(self.block_size):
                    hasher.update(chunk)
        except IOError as e:
            raise HashEngineError(f"Error reading file {file_path}: {e}")
            
        return hasher.hexdigest()

    def hash_memory(self, data: bytes) -> str:
        """Calculates the hash of data in memory (bytes)."""
        hasher = self._get_hasher()
        hasher.update(data)
        return hasher.hexdigest()

    # Future extension: hash_directory, hash_list, etc.
    # Example: Policy specifies hashing all files in a model directory

    def set_algorithm(self, new_algorithm: str):
        """Allows runtime change of hashing algorithm for policy compliance."""
        self.algorithm = new_algorithm
        # Test instantiation immediately to catch unsupported algorithms
        self._get_hasher()
        
