from typing import TypedDict, Protocol, Dict, Any, Optional

# === Governance Data Structures ===

class PolicyProposalState(TypedDict):
    """Defines the canonical structure for the actual policy content."""
    version: str
    ACVD: Dict[str, Any]  # Access Control Validation Dictionary
    FASV: Dict[str, Any]  # Feature Activation Status Variables

class StagingArtifact(TypedDict):
    """Defines the final, sealed artifact stored by the CRoT layer."""
    CSR_HASH_N_PLUS_1: str
    POLICY_PAYLOAD: PolicyProposalState
    QUORUM_ATTESTATION: Dict[str, str]
    STATUS: str
    HASH_ALGORITHM: str

# === Persistence & Vault Interfaces (DIP) ===

class SecureVaultInterface(Protocol):
    """Protocol defining the high-security storage API (e.g., KMS/HSE backed storage)."""
    def put(self, vault_id: str, key: str, data: str) -> bool:
        """Stores data securely under a key."""
        ...
    
    def get(self, vault_id: str, key: str) -> Optional[str]:
        """Retrieves data by key."""
        ...
    
    def get_current_pointer(self, vault_id: str) -> Optional[str]:
        """Retrieves the pointer/key pointing to the currently active artifact (CSR_N)."""
        ...