import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional, Protocol, runtime_checkable, TypedDict

# --- Types and Protocols for internal cohesion and external contracts ---

class GPISManifestEntry(TypedDict):
    """Defines the strict structure for an entry committed to the GPIS Ledger.
    The version_hash is derived solely from the 'parameters' content itself.
    """
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
    
    Storage is expected to be keyed first by manifest_name, then by key_hash.
    """
    def write_entry(self, manifest_name: str, key_hash: str, entry: GPISManifestEntry) -> None:
        """Writes a new entry keyed by its version_hash. Must be idempotent against the key_hash."""
        ...

    def lookup_by_hash(self, manifest_name: str, key_hash: str) -> Optional[GPISManifestEntry]:
        """Retrieves an entry using its explicit integrity hash (version_hash)."""
        ...

    def fetch_latest(self, manifest_name: str) -> Optional[GPISManifestEntry]:
        """Retrieves the most recently committed/highest-versioned entry."""
        ...

# --- Custom Exceptions for robust service handling ---
class GPISIntegrityError(Exception):
    """Raised when parameter checksum verification fails (data tampering detected)."""
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
    
    It operates purely as a transaction and verification layer over an
    immutable storage backend compliant with ImmutableLedgerProtocol.
    """

    def __init__(self, storage_backend: ImmutableLedgerProtocol):
        """Initializes GPIS with a compliant immutable storage backend."""
        self.storage: ImmutableLedgerProtocol = storage_backend

    def _generate_content_hash(self, data: Dict[str, Any]) -> str:
        """
        Generates a deterministic content hash ({CONTENT_HASH_ALGORITHM}) for 
        the parameter dictionary by serializing it canonically (sorted keys, compact).
        This hash serves as the entry's unique identifier and ledger key.
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
        
        content_hash = self._generate_content_hash(parameters)
        
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
        
        Returns: The verified parameter dictionary.
        Raises: GPISManifestNotFound, GPISIntegrityError
        """
        
        if required_hash:
            entry_candidate = self.storage.lookup_by_hash(manifest_name, required_hash)
        else:
            # Fetch latest committed entry
            entry_candidate = self.storage.fetch_latest(manifest_name)
            
        if not entry_candidate:
            target_identifier = required_hash if required_hash else "latest state"
            raise GPISManifestNotFound(f"Manifest '{manifest_name}' for {target_identifier} not found.")
        
        entry: GPISManifestEntry = entry_candidate
        hash_to_verify = entry['version_hash']
        
        # Post-fetch verification (essential integrity check)
        actual_hash = self._generate_content_hash(entry['parameters'])

        if actual_hash != hash_to_verify:
            raise GPISIntegrityError(
                f"Integrity check failed for {manifest_name}. Expected hash {hash_to_verify}, "
                f"but parameters content yields {actual_hash}. Potential ledger tampering detected."
            )
        
        return entry['parameters']

    def fetch_latest_entry(self, manifest_name: str) -> GPISManifestEntry:
        """Fetches the full, cryptographically verified latest manifest entry (including metadata)."""
        
        # This call implicitly verifies the data integrity internally
        parameters = self.fetch_verified_parameters(manifest_name, required_hash=None)
        
        # Fetching the entry again solely to retrieve metadata, since fetch_verified_parameters only returns Dict[str, Any].
        # This ensures we get the *actual* latest entry object, including timestamp and parent_hash.
        latest_entry = self.storage.fetch_latest(manifest_name)
        
        # Re-verify fetch_latest returned the correct entry, though the internal hash check ensures the parameters are safe.
        if not latest_entry or latest_entry['parameters'] != parameters:
            # Should ideally never happen if storage is working correctly and parameters verification passed.
             raise GPISIntegrityError("Consistency error during latest entry retrieval.")
             
        return latest_entry
