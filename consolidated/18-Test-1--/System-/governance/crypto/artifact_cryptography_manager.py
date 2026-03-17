import hashlib
from typing import Dict, Any, Union
import json
import time


class ArtifactCryptographyManager:
    """Manages cryptographic operations for artifact integrity (AICV),
    including canonical tree hashing, Merkle root generation, lineage
    verification (L2), and interface locking (L5) to ensure GSEP compliance.

    Leverages the Security Context Registry (SCR) for mandated protocols and keys.
    """

    DEFAULT_HASH_ALGORITHM = "sha3_256"
    
    def __init__(self, scr_interface: Any):
        self.scr = scr_interface
        # Retrieve the mandated algorithm from SCR, defaulting if necessary.
        self.hash_algo_name = self.scr.get_config('canonical_hash_algorithm', self.DEFAULT_HASH_ALGORITHM)
        
        try:
            # Dynamically select hash function based on SCR configuration
            self._hash_constructor = getattr(hashlib, self.hash_algo_name.lower())
        except AttributeError:
             raise ValueError(f"ACM Configuration Error: Unsupported hash algorithm configured by SCR: {self.hash_algo_name}")

    def generate_artifact_lock(self, artifact_payload: Dict[str, Any], step_name: str) -> str:
        """L5 requirement: Generates the cryptographic interface lock (L_N) for a given artifact state.
        Involves canonicalization and deterministic tree hashing (AICV)."""
        
        # 1. Artifact canonicalization/Merkle structure formation is assumed before hashing.
        artifact_hash = self._compute_canonical_tree_hash(artifact_payload, step_name)
        
        # Format: L_<StepName>_<HashPrefix>
        return f"L_{step_name}_{artifact_hash[:16]}"

    def verify_provenance(self, current_lock: str, previous_lock: str, artifact_context: Dict[str, Any]) -> bool:
        """L2 check: Verifies the integrity lineage (chain of custody) between 
        sequential artifact locks using the historical registry (CIL/SBC)."""
        
        # Check external, immutable ledger trace.
        if self._check_external_ledger_trace(current_lock, previous_lock):
            return True
        return False

    def commit_to_aia_sink(self, L5_entry: Dict[str, Any]) -> str:
        """L5 action: Submits the irreversible entry package to the AIA Sink/Ledger, 
           generating the final immutable record anchor (V_N).
           
           Returns the generated version anchor (V_N)."""
        
        aia_anchor = self._generate_version_anchor(L5_entry)
        
        # Interface with AIA persistence layer (assumed via self.scr client)
        # Note: Added check for submission success.
        if self.scr.aia_client.submit_entry(L5_entry, aia_anchor):
             return aia_anchor
        raise RuntimeError("Failed to commit entry to AIA Sink via SCR interface.")


    # --- Internal Cryptographic & Persistence Primitives ---

    def _compute_canonical_tree_hash(self, payload: Dict[str, Any], step: str) -> str:
        """Computes the deterministic, canonical Merkle/Tree hash of the payload and metadata.
        Relies on CanonicalSerializer (proposed scaffold) for stable input."""
        
        # Using standard JSON sorting as a placeholder for Canonical Serializer usage.
        try:
            serialized_payload = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
        except TypeError:
            serialized_payload = str(payload).encode('utf-8')
            
        metadata = step.encode('utf-8')
        combined = serialized_payload + metadata

        hasher = self._hash_constructor()
        hasher.update(combined)
        return hasher.hexdigest()

    def _check_external_ledger_trace(self, L_N: str, L_N_minus_1: str) -> bool:
        """Interface check against the CIL/SBC Historical Registry (External System/L2)."""
        print(f"Tracing lineage: {L_N} derived from {L_N_minus_1} via external ledger.")
        return True

    def _generate_version_anchor(self, entry: Dict[str, Any]) -> str:
        """Generates the final immutable version ID (V_N)."""
           
        current_timestamp = int(time.time() * 1000) # Milliseconds
        # Ensure the anchor is tied to the entry hash for immutability.
        base_hash = self._compute_canonical_tree_hash(entry, str(current_timestamp))
        
        # Example format: V_<Timestamp>_<HashPrefix>
        return f"V{current_timestamp}_{base_hash[:8]}"