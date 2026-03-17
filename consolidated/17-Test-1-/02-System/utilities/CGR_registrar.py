# Configuration Governance Registrar (CGR) Utility
# Optimized for maximizing computational efficiency and recursive abstraction.

import hashlib
import json
import logging
from typing import Dict, Any, Union

# --- Configuration Section ---
logging.basicConfig(level=logging.INFO, format='%(levelname)s:CGR:%(message)s')
# --- End Configuration Section ---

class CGRUtility:
    """
    Configuration Governance Registrar (CGR) Utility.
    Abstracts the compilation of the Config State Root (CSR) from N governance artifacts.
    """
    
    # Define immutable constants for cryptographic stability
    ENCODING = 'utf-8'
    HASH_ALGORITHM = 'sha3_256'
    ARTIFACT_DELIMITER = b'|'

    def __init__(self, artifact_specs: Dict[str, str]):
        """
        Initializes the registrar and immediately compiles the full CSR byte chain 
        from the provided artifact specifications ({Identifier: path}).
        This optimizes runtime efficiency by front-loading all I/O and serialization.
        """
        self._artifact_specs = artifact_specs
        # Pre-compile the entire byte sequence (I/O heavy steps)
        self.csr_bytes_chain = self._compile_artifact_chain()

    @staticmethod
    def _load_artifact(path: str) -> Dict[str, Any]:
        """Abstract loading: Loads and parses a JSON artifact with robust error handling."""
        try:
            with open(path, 'r', encoding=CGRUtility.ENCODING) as f:
                return json.load(f)
        except (FileNotFoundError, IOError) as e:
            logging.critical(f"Required artifact not found or inaccessible: {path}")
            raise IOError(f"Cannot proceed without file: {path}") from e
        except json.JSONDecodeError as e:
            logging.critical(f"Artifact content is invalid JSON: {path}")
            raise ValueError(f"Invalid artifact format: {path}") from e
        except Exception as e:
            logging.critical(f"Unexpected error loading {path}: {e}")
            raise

    @staticmethod
    def _get_deterministic_json_bytes(data: Dict[str, Any]) -> bytes:
        """Serializes data into deterministic JSON bytes using standard sorting and minimal separators."""
        # Max efficiency serialization: sort_keys=True, separators=(',', ':')
        serialized_string = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return serialized_string.encode(CGRUtility.ENCODING)

    def _compile_artifact_chain(self) -> bytes:
        """
        Core Recursive Abstraction Layer:
        Iteratively processes N artifacts, standardizes content (using identifier prefixes), 
        and compiles them into a single, delimited byte chain (Header + Content + Delimiter).
        Processing order is enforced by sorting artifact identifiers (keys).
        """
        
        # 1. Determine deterministic processing order
        sorted_identifiers = sorted(self._artifact_specs.keys())
        
        # Optimization: Use bytearray for efficient in-memory concatenation 
        compiled_bytes = bytearray()
        total_artifacts = len(sorted_identifiers)
        
        for i, identifier in enumerate(sorted_identifiers):
            path = self._artifact_specs[identifier]
            
            # Load and Serialize (Costly steps)
            artifact_data = self._load_artifact(path)
            artifact_bytes = self._get_deterministic_json_bytes(artifact_data)
            
            # Construct Header (Identifier + Delimiter ':')
            header_prefix = f"{identifier}:".encode(self.ENCODING)
            
            # Append Header and Content
            compiled_bytes.extend(header_prefix)
            compiled_bytes.extend(artifact_bytes)
            
            # Append Global Separator (if not the last artifact)
            if i < total_artifacts - 1:
                compiled_bytes.extend(self.ARTIFACT_DELIMITER) 

        logging.info(f"Compiled CSR byte chain successfully from {total_artifacts} artifacts.")
        return bytes(compiled_bytes)

    def calculate_csr(self) -> str:
        """
        Calculates the verifiable Config State Root (CSR) hash.
        This operation is now purely computational, leveraging the pre-compiled chain.
        """
        hasher = hashlib.new(self.HASH_ALGORITHM)
        hasher.update(self.csr_bytes_chain)
        
        csr_hash = hasher.hexdigest()
        
        logging.info(f"CSR generated: {csr_hash[:16]}...")
        return csr_hash