from typing import Protocol, Any, Dict

# Note: This file relies on StagingArtifact definition, assumed external.
class StagingArtifact(Dict[str, Any]):
    pass

class IPersistenceAdapter(Protocol):
    """
    Defines the standard interface for services responsible for securely storing
    and retrieving Config State Roots (CSRs).
    Implementations might use a database, distributed ledger, or immutable storage API.
    """
    
    def write_artifact(self, artifact: StagingArtifact) -> None:
        """Stores a ratified StagingArtifact immutably and atomically.
        This operation must ensure transactional integrity (write succeeds/fails entirely).
        Raises: Exception on persistence failure.
        """
        ...

    def get_latest_hash(self) -> str:
        """Retrieves the latest committed CSR hash stored in the persistence layer.
        Raises: IOError or PersistenceError if the repository is unavailable.
        """
        ...

    def get_artifact(self, csr_hash: str) -> Optional[StagingArtifact]:
        """Retrieves a specific artifact by its hash.
        Returns: The artifact dictionary or None if not found.
        """
        ...