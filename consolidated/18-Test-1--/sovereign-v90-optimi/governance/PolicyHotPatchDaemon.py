import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, TypedDict

# --- [ Custom Exceptions ] ---

class PolicyDaemonError(Exception):
    """Base exception for Policy Hot Patch Daemon operations."""

class ProposalNotLoadedError(PolicyDaemonError):
    """Raised when an operation requires an active proposal but none is loaded."""

class QuorumNotMetError(PolicyDaemonError):
    """Raised when attempting finalization without sufficient signatures."""

# --- [ Data Contracts / Structures ] ---

class ProposalPayload(TypedDict):
    """Defines the structure of the policy content supplied by the caller (Input)."""
    ACVD: Dict[str, Any]
    FASV: Dict[str, Any]

class ImmutablePolicySource(TypedDict):
    """The complete immutable data set that is hashed to form the CSR_N+1."""
    version_id: str  # Generated timestamp + unique ID prefix
    ACVD: Dict[str, Any]
    FASV: Dict[str, Any]

class StagingArtifact(TypedDict):
    """The final, signed result ready for persistence and anchoring."""
    CSR_HASH_N_PLUS_1: str
    POLICY_PAYLOAD: ImmutablePolicySource
    QUORUM_ATTESTATION: Dict[str, str]
    STATUS: str
    HASH_ALGORITHM: str

class ProposalStateInternal(TypedDict):
    """Internal, ephemeral state container for an active proposal."""
    proposal: ImmutablePolicySource
    csr_hash: str
    signatures: Dict[str, str]

# --- [ Dependencies / Interfaces ] ---

class SignatureVerifier:
    """Interface for strong cryptographic verification of attestations."""
    def verify(self, payload_hash: str, authority_id: str, signature: str) -> bool:
        # Placeholder for actual verification logic
        return len(signature) > 10 and authority_id is not None 

# --- [ Core Hashing Logic Utility ] ---

class ConfigStateHasher:
    """Utility class to ensure deterministic hashing of configuration states."""

    DEFAULT_ALGORITHM: str = 'sha3_512'

    @staticmethod
    def calculate(data_source: ImmutablePolicySource, algorithm: str = DEFAULT_ALGORITHM) -> str:
        """Calculates the deterministic hash based on standardized JSON representation."""
        
        # Security/Efficiency: Ensure deterministic JSON serialization
        # Standard: sort_keys=True, compact separators=(',', ':')
        try:
            proposal_string = json.dumps(data_source, sort_keys=True, separators=(',', ':'))
        except TypeError as e:
            raise ValueError(f"Invalid serializable data structure provided: {e}")
        
        if algorithm not in hashlib.algorithms_available:
            raise ValueError(f"Hashing Algorithm '{algorithm}' not available.")
            
        hasher = hashlib.new(algorithm)
        hasher.update(proposal_string.encode('utf-8'))
        return hasher.hexdigest()

# --- [ Daemon Implementation ] ---

class PolicyHotPatchDaemon:
    """
    PHPD (Policy Hot-Patch Daemon) - V2.2: Enhanced State Management and Robustness.
    Role: Secure, off-cycle staging and ratification of the next Config State Root (CSR_N+1).
    """

    def __init__(self, required_quorum_signatures: int, verifier: SignatureVerifier):
        self.quorum_count: int = required_quorum_signatures
        self.verifier: SignatureVerifier = verifier
        
        # Encapsulated state container, initialized to None
        self._current_state: Optional[ProposalStateInternal] = None

    def is_proposal_active(self) -> bool:
        """Checks if a valid proposal is currently loaded and awaiting ratification."""
        return self._current_state is not None

    def load_proposal(self, proposal_data: ProposalPayload) -> str:
        """Loads the Tier 1 artifacts, generates versioning metadata, and computes the CSR hash."""
        
        # 1. Generate deterministic version ID using explicit UTC (ZULU time) and high precision
        version_timestamp = datetime.now(timezone.utc).isoformat(timespec='microseconds')
        version_id = f"CSR_P_{version_timestamp}" 
        
        new_proposal_source: ImmutablePolicySource = {
            "version_id": version_id, 
            "ACVD": proposal_data["ACVD"],
            "FASV": proposal_data["FASV"]
        }
        
        # 2. Calculate the future CSR hash (CSR_N+1)
        proposed_csr_hash = ConfigStateHasher.calculate(
            new_proposal_source, ConfigStateHasher.DEFAULT_ALGORITHM
        )
        
        # 3. Update internal state container and reset signatures
        self._current_state: ProposalStateInternal = {
            "proposal": new_proposal_source,
            "csr_hash": proposed_csr_hash,
            "signatures": {}
        }
        
        return proposed_csr_hash

    def ratify(self, authority_id: str, signature: str) -> bool:
        """Adds cryptographic ratification, requiring signature verification against the proposed CSR hash."""
        
        if not self._current_state:
            raise ProposalNotLoadedError("Proposal must be loaded before ratification attempts.")

        current_hash = self._current_state['csr_hash']
        
        if authority_id in self._current_state['signatures']:
            # Authority already signed, idempotent or malicious attempt
            return False 

        # INTEGRITY CHECK: Use the injected verifier for security best practices
        if not self.verifier.verify(current_hash, authority_id, signature):
            return False 

        # State mutation: add signature
        self._current_state['signatures'][authority_id] = signature
        return True

    def finalize_and_stage(self) -> StagingArtifact:
        """Finalizes the new CSR proposal if quorum is met, producing the definitive staging artifact."""
        
        if not self._current_state:
            raise ProposalNotLoadedError("Cannot finalize; no active proposal found.")
        
        signatures = self._current_state['signatures']
        
        # Check Quorum
        if len(signatures) < self.quorum_count:
            raise QuorumNotMetError(
                f"Quorum failed. Need {self.quorum_count} signatures, found {len(signatures)}."
            )
            
        # Quorum met, construct final artifact and clear internal state
        staging_artifact: StagingArtifact = {
            "CSR_HASH_N_PLUS_1": self._current_state['csr_hash'],
            "POLICY_PAYLOAD": self._current_state['proposal'],
            "QUORUM_ATTESTATION": signatures,
            "STATUS": "READY_FOR_S00_ANCHORING",
            "HASH_ALGORITHM": ConfigStateHasher.DEFAULT_ALGORITHM
        }
        
        # CRITICAL: Clear proposal state immediately after successful finalization
        self._current_state = None
        
        return staging_artifact
