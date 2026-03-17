from typing import Protocol, Optional, Dict, Any, TypedDict

class PolicyProposalState(TypedDict):
    """Defines the structure for the Policy Proposal payload, encompassing ACVD and FASV."""
    version: str
    ACVD: Dict[str, Any]  # Access Control Value Definitions
    FASV: Dict[str, Any]  # Feature Activation State Values

class StagingArtifact(TypedDict):
    """Defines the structure of a fully ratified, staging artifact ready for anchoring."""
    CSR_HASH_N_PLUS_1: str
    POLICY_PAYLOAD: PolicyProposalState
    QUORUM_ATTESTATION: Dict[str, str]
    STATUS: str # e.g., 'RATIFIED'
    HASH_ALGORITHM: str # e.g., 'SHA256'

class SecureVaultInterface(Protocol):
    """Abstract base interface for a secure persistence layer (Hardware Security Module, Database, etc.)."""
    
    def put(self, vault_id: str, key: str, data: str) -> bool:
        """Stores data securely under a given key."""
        ...
    
    def get(self, vault_id: str, key: str) -> Optional[str]:
        """Retrieves data stored under a given key."""
        ...
    
    def get_current_pointer(self, vault_id: str) -> Optional[str]:
        """Retrieves the cryptographic hash pointing to the currently active configuration state root (CSR_N)."""
        ...
    
    # Note: A real implementation would include key management and signing/verification methods.