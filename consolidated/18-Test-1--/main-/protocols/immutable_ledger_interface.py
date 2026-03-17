from typing import Optional, Dict, Any, Protocol, TypedDict

class GPISManifestEntry(TypedDict):
    """Central definition for a GPIS block/entry, mirroring the structure in the service implementation."""
    timestamp: str
    version_hash: str
    parent_hash: Optional[str]
    author_attestation: str
    parameters: Dict[str, Any]

class ImmutableLedgerInterface(Protocol):
    """This interface defines the required contract for any backend service (DB, block store, file system) 
    that serves as an attested, append-only immutable ledger for critical system parameters.
    """

    def write_entry(self, manifest_name: str, key_hash: str, entry: GPISManifestEntry) -> None:
        """Persists a structured entry, indexed by manifest name and content hash. Must be atomic."""
        ...

    def lookup_by_hash(self, manifest_name: str, key_hash: str) -> Optional[GPISManifestEntry]:
        """Retrieves a specific entry based on its content hash."""
        ...

    def fetch_latest(self, manifest_name: str) -> Optional[GPISManifestEntry]:
        """Retrieves the entry associated with the highest sequence number or latest timestamp for the manifest."""
        ...

    def verify_attestation(self, manifest_name: str, key_hash: str) -> bool:
        """Optional: Provides mechanism for the service to check backend-specific attestations (e.g., hardware signature)."""
        return True
