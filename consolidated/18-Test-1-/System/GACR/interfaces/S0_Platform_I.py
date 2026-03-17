from typing import Protocol, List

# --- Interface Definitions for GSEP-C S0 Environment ---
# These protocols standardize the access paths required by HETMVerifier.

class CRACryptoInterface(Protocol):
    """Certificate and Root of Trust Cryptography Access (CRA)."""
    def verify(self, payload: bytes, signature: bytes, public_key: bytes) -> bool:
        """Verifies the signature against the payload using the specified key."""
        ...

class HIPAHardwareInterface(Protocol):
    """Hardware Isolation and Platform Access (HIPA)."""
    def get_platform_measurement(self) -> str:
        """Returns the canonical, measured root-of-trust state (e.g., combined PCR hash)."""
        ...
    def has_features(self, required_features: List[str]) -> bool:
        """Checks if the underlying hardware/firmware exposes specific required features."""
        ...

class NetSecInterface(Protocol):
    """Secure Network Connectivity Verification."""
    def verify_endpoint_reachability(self, endpoint_uri: str, timeout: int) -> bool:
        """Attempts to verify reachability and security of a critical endpoint (e.g., audit server)."""
        ...
