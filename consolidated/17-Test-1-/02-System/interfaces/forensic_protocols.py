from typing import Dict, Any, Optional, Protocol

class ISecureLogRepository(Protocol):
    """Protocol for the secure, persistent log storage layer (P-R04).
    Implementations MUST guarantee atomic and verifiable commit operations.
    """
    def store_log(self, sealed_entry: Dict[str, Any]) -> None:
        """Stores the sealed entry atomically and synchronously."""
        ...

    def retrieve_log(self, ih_event_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a previously stored sealed entry."""
        ...

class IAtomicSigningService(Protocol):
    """Protocol for the service guaranteeing atomic, verifiable cryptographic signing (AASS).
    This service provides the authenticity root for the sealed telemetry."""
    
    def sign_log_entry(self, metadata: Dict[str, Any]) -> str:
        """Cryptographically signs the metadata dictionary. Must be atomic."""
        ...
