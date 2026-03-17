from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class ImmutableLedgerInterface(ABC):
    """
    Abstract Base Class defining the required interface for storage backends
    used by the Governance Parameter Immutability Service (GPIS).
    
    Implementations must guarantee atomicity and persistence integrity.
    """

    @abstractmethod
    def write_entry(self, manifest_name: str, version_hash: str, entry: Dict[str, Any]) -> None:
        """Writes a new, attested parameter entry into the ledger, indexed by manifest name and version hash."""
        pass

    @abstractmethod
    def lookup_by_hash(self, manifest_name: str, version_hash: str) -> Optional[Dict[str, Any]]:
        """Retrieves a specific parameter entry using its manifest name and verified version hash."""
        pass

    @abstractmethod
    def fetch_latest(self, manifest_name: str) -> Optional[Dict[str, Any]]:
        """Retrieves the entry representing the most recently committed version for a given manifest."""
        pass

    @abstractmethod
    def load_all_parameters(self) -> Dict[str, Any]:
        """Utility method for system initialization/auditing (if historical load is required)."""
        # Note: GPIS is generally stateless, but the backend must support this method if a historical full load is necessary for other components.
        pass