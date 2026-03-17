from typing import Dict, Any, Optional
from utilities.gpis_parameter_service import ImmutableLedgerProtocol, GPISManifestEntry

class InMemoryLedger(ImmutableLedgerProtocol):
    """
    A concrete, in-memory implementation of the ImmutableLedgerProtocol.
    Used primarily for testing, demonstration, or lightweight ephemeral environments.

    Storage structure: 
    {
        'manifest_name': {
            'key_hash': GPISManifestEntry, 
            '_latest_hash': 'key_hash_of_most_recent_commit'
        }
    }
    """
    def __init__(self):
        self._data: Dict[str, Dict[str, Any]] = {}

    def write_entry(self, manifest_name: str, key_hash: str, entry: GPISManifestEntry) -> None:
        # Ensure manifest namespace exists
        if manifest_name not in self._data:
            self._data[manifest_name] = {}

        # 1. Store the entry using its content hash (immutability constraint)
        if key_hash in self._data[manifest_name]:
            # This entry already exists due to idempotent content hashing
            return
        
        self._data[manifest_name][key_hash] = entry
        
        # 2. Update the pointer to the latest entry
        # Note: This simple implementation assumes commits are always incremental (no branching/rollback simulation needed)
        self._data[manifest_name]['_latest_hash'] = key_hash

    def lookup_by_hash(self, manifest_name: str, key_hash: str) -> Optional[GPISManifestEntry]:
        if manifest_name not in self._data:
            return None
        return self._data[manifest_name].get(key_hash)

    def fetch_latest(self, manifest_name: str) -> Optional[GPISManifestEntry]:
        if manifest_name not in self._data or '_latest_hash' not in self._data[manifest_name]:
            return None
        
        latest_hash = self._data[manifest_name].get('_latest_hash')
        if not latest_hash:
            return None
            
        return self._data[manifest_name].get(latest_hash)

    def clear(self): 
        """Utility for clearing all data (only for testing)."""
        self._data = {}