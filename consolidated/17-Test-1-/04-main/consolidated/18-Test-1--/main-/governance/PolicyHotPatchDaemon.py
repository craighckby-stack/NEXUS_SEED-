import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, TypedDict

# --- [ Configuration Constants ] ---

DEFAULT_HASH_ALGO: str = 'sha3_512'

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
    version_id: str
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

# --- [ Recursive Abstraction Layer: Pure Functions ] ---

def _calculate_policy_hash(data_source: ImmutablePolicySource) -> str:
    """Purity Layer 1: Calculates the deterministic hash of the policy source."""
    try:
        # Efficiency: Ensure deterministic JSON serialization for consistent hashing
        proposal_string = json.dumps(data_source, sort_keys=True, separators=(',', ':'))
    except TypeError as e:
        raise ValueError(f"Invalid serializable data structure provided: {e}")
    
    if DEFAULT_HASH_ALGO not in hashlib.algorithms_available:
        # Fatal configuration error during runtime
        raise RuntimeError(f"Hashing Algorithm '{DEFAULT_HASH_ALGO}' not available.")
        
    hasher = hashlib.new(DEFAULT_HASH_ALGO)
    hasher.update(proposal_string.encode('utf-8'))
    return hasher.hexdigest()


def _create_initial_state(proposal_data: ProposalPayload) -> ProposalStateInternal:
    """Purity Layer 2: Abstracts versioning, construction, and hashing into one state factory."""
    
    # Generate deterministic version ID (high precision UTC)
    version_timestamp = datetime.now(timezone.utc).isoformat(timespec='microseconds')
    version_id = f"CSR_P_{version_timestamp}" 
    
    new_proposal_source: ImmutablePolicySource = {
        "version_id": version_id, 
        "ACVD": proposal_data["ACVD"],
        "FASV": proposal_data["FASV"]
    }
    
    # Recurse/Delegate to hashing utility
    proposed_csr_hash = _calculate_policy_hash(new_proposal_source)
    
    return {
        "proposal": new_proposal_source,
        "csr_hash": proposed_csr_hash,
        "signatures": {}
    }

# --- [ Engine Implementation ] ---

class PolicyRatificationEngine:
    """
    Policy Ratification Engine (PRE) - Manages the state machine for policy staging.
    Focuses only on state transitions and validation, deferring data generation to pure functions.
    """

    def __init__(self, required_quorum_signatures: int, verifier: SignatureVerifier):
        self.quorum_count: int = required_quorum_signatures
        self.verifier: SignatureVerifier = verifier
        self._current_state: Optional[ProposalStateInternal] = None

    def is_proposal_active(self) -> bool:
        """Checks if a valid proposal is currently loaded."""
        return self._current_state is not None

    def load_proposal(self, proposal_data: ProposalPayload) -> str:
        """Loads proposal by calling the state factory abstraction."""
        
        # State Transition: Use the factory function to initialize state.
        self._current_state = _create_initial_state(proposal_data)
        
        return self._current_state['csr_hash']

    def ratify(self, authority_id: str, signature: str) -> bool:
        """Adds cryptographic ratification, verifying signature against the proposed hash."""
        
        if not self._current_state:
            raise ProposalNotLoadedError("Proposal must be loaded before ratification attempts.")

        current_hash = self._current_state['csr_hash']
        
        # Idempotency check
        if authority_id in self._current_state['signatures']:
            return False 

        # Security Check: External verification (dependency injection)
        if not self.verifier.verify(current_hash, authority_id, signature):
            return False 

        # State mutation
        self._current_state['signatures'][authority_id] = signature
        return True

    def finalize_and_stage(self) -> StagingArtifact:
        """Finalizes the proposal if quorum is met, producing the definitive artifact."""
        
        if not self._current_state:
            raise ProposalNotLoadedError("Cannot finalize; no active proposal found.")
        
        signatures = self._current_state['signatures']
        
        if len(signatures) < self.quorum_count:
            raise QuorumNotMetError(
                f"Quorum failed. Need {self.quorum_count} signatures, found {len(signatures)}."
            )
            
        # Quorum met, construct final artifact
        staging_artifact: StagingArtifact = {
            "CSR_HASH_N_PLUS_1": self._current_state['csr_hash'],
            "POLICY_PAYLOAD": self._current_state['proposal'],
            "QUORUM_ATTESTATION": signatures,
            "STATUS": "READY_FOR_S00_ANCHORING",
            "HASH_ALGORITHM": DEFAULT_HASH_ALGO
        }
        
        # CRITICAL: Clear proposal state upon successful finalization
        self._current_state = None
        
        return staging_artifact