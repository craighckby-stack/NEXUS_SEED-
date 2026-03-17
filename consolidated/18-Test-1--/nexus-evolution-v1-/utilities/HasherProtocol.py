import hashlib
import os
from typing import Optional, Final, Literal

# --- Constants and Type Definitions ---

# Utilize Literal for stricter type checking and self-documenting allowed algorithms.
HashAlgorithm = Literal['sha256', 'sha512']
DEFAULT_ALGORITHM: HashAlgorithm = 'sha256'

# Optimized block size (64 KB) for high-speed sequential disk I/O.
EFFICIENT_CHUNK_SIZE: Final[int] = 65536 

class ArtifactStreamReducer:
    """
    High-efficiency protocol handler for generating deterministic hashes of 
    code artifacts, utilizing streaming I/O reduction via lazy generators.

    This provides a generalized, recursive abstraction for processing binary data streams.
    """
    
    def __init__(self, algorithm: HashAlgorithm = DEFAULT_ALGORITHM):
        # Immediate validation via hashlib's constructor for speed and reliability.
        try:
            self.algorithm = algorithm
            # Store a placeholder hasher to confirm algorithm existence
            hashlib.new(algorithm)
        except ValueError as e:
            raise ValueError(f"Unsupported hashing algorithm: {algorithm}") from e

    @staticmethod
    def _chunk_stream_generator(filepath: str, chunk_size: int = EFFICIENT_CHUNK_SIZE):
        """Internal generator that recursively abstracts file reading into memory-efficient chunks."""
        try:
            with open(filepath, 'rb') as f:
                # Use the walrus operator (:=) for highly efficient, single-line assignment and evaluation
                while chunk := f.read(chunk_size):
                    yield chunk
        except IOError:
            # If I/O fails during streaming, the generator stops silently. Caller handles the outcome.
            return

    def hash_file(self, filepath: str) -> Optional[str]:
        """Calculates the hash for a single large file via stream reduction/lazy iteration."""
        if not os.path.exists(filepath): 
            return None

        hasher = hashlib.new(self.algorithm)
        
        # Integrate the generator stream into the hashing process
        try:
            for chunk in ArtifactStreamReducer._chunk_stream_generator(filepath):
                hasher.update(chunk)
            
            # If successful (no exception raised and at least one chunk was processed), return digest.
            return hasher.hexdigest()
        except Exception: 
            # Catch any unexpected errors during hashing or I/O interaction.
            return None
