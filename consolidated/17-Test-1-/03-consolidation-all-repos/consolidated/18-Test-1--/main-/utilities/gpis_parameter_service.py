import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional, Protocol, runtime_checkable, TypedDict

# --- Types and Protocols for internal cohesion and external contracts ---

class GPISManifestEntry(TypedDict):
    """Defines the strict structure for an entry committed to the GPIS Ledger."""
    timestamp: str
    version_hash: str
    parent_hash: Optional[str]
    author_attestation: str
    parameters: Dict[str, Any]

@runtime_checkable
class ImmutableLedgerProtocol(Protocol):
    """
    Protocol defining the minimum contract for the immutable storage backend
    utilized by GPIS (e.g., Block store, Auditable DB).
    """
    def write_entry(self, manifest_name: str, key_hash: str, entry: GPISManifestEntry) -> None:
        """Writes a new entry keyed by its version_hash."""
        ...

    def lookup_by_hash(self, manifest_name: str, key_hash: str) -> Optional[GPISManifestEntry]:
        """Retrieves an entry using its explicit integrity hash."""
        ...

    def fetch_latest(self, manifest_name: str) -> Optional[GPISManifestEntry]:
        """Retrieves the most recently committed/highest-versioned entry."""
        ...

# --- Custom Exceptions for robust service handling ---
class GPISIntegrityError(Exception):
    """Raised when parameter checksum verification fails."""
    pass

class GPISManifestNotFound(Exception):
    """Raised when the specified manifest name or required hash is not found."""
    pass

# Constants
CONTENT_HASH_ALGORITHM = 'sha256'

class GovernanceParameterImmutabilityService:
    """
    GPIS ensures cryptographic integrity, versioning, and auditable history
    for sensitive governance parameters (e.g., PVLM, CFTM, ADTM).
    Utilized by GAX and attested by CRoT.

    It operates purely as a transaction and verification layer over an
    immutable storage backend compliant with ImmutableLedgerProtocol.
    """

    def __init__(self, storage_backend: ImmutableLedgerProtocol):
        """Initializes GPIS with a compliant immutable storage backend."""
        self.storage: ImmutableLedgerProtocol = storage_backend

    def _generate_checksum(self, data: Dict[str, Any]) -> str:
        """
        Generates a deterministic checksum using {CONTENT_HASH_ALGORITHM} for 
        the parameter dictionary by serializing it canonically.
        """
        # Use compact separators and sorted keys for canonical JSON output
        data_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

    def commit_parameters(
        self, 
        manifest_name: str, 
        parameters: Dict[str, Any], 
        author_attestation: str,
        parent_hash: Optional[str] = None 
    ) -> str:
        """Commits a new version of governance parameters and returns its integrity hash.
        The content hash serves as the block's unique identifier and ledger key.
        """
        
        content_hash = self._generate_checksum(parameters)
        
        entry: GPISManifestEntry = {
            "timestamp": datetime.utcnow().isoformat(), # Standardized ISO 8601 UTC
            "version_hash": content_hash,
            "parent_hash": parent_hash,
            "author_attestation": author_attestation,
            "parameters": parameters
        }
        
        # Storage uses content_hash as the explicit, non-rewritable key
        self.storage.write_entry(manifest_name, content_hash, entry)
        
        return content_hash

    def fetch_verified_parameters(self, manifest_name: str, required_hash: Optional[str] = None) -> Dict[str, Any]:
        """Fetches and cryptographically verifies the required parameters against 
        an integrity hash or the latest committed state.
        
        Raises: GPISManifestNotFound, GPISIntegrityError
        """
        
        if required_hash:
            entry_candidate = self.storage.lookup_by_hash(manifest_name, required_hash)
            if not entry_candidate:
                raise GPISManifestNotFound(f"Manifest '{manifest_name}' or specific hash '{required_hash}' not found.")
        else:
            # Fetch latest committed entry
            entry_candidate = self.storage.fetch_latest(manifest_name)
            if not entry_candidate:
                raise GPISManifestNotFound(f"Manifest '{manifest_name}' has no committed entries.")
            required_hash = entry_candidate['version_hash'] 
        
        entry: GPISManifestEntry = entry_candidate
        
        # Post-fetch verification (essential integrity check)
        actual_hash = self._generate_checksum(entry['parameters'])

        if actual_hash != required_hash:
            raise GPISIntegrityError(
                f"Integrity check failed for {manifest_name}. Expected hash {required_hash}, "
                f"but parameters content yields {actual_hash}. Potential ledger tampering detected."
            )
        
        return entry['parameters']
