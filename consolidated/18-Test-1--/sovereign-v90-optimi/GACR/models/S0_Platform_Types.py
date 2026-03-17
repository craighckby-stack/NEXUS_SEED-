from typing import NamedTuple, List, Optional
from datetime import datetime

# --- Sovereign AGI GACR Measurement Data Types ---

class MeasurementLogEntry(NamedTuple):
    """Represents a single entry in a cryptographic Measurement Log (e.g., TCG log structure)."""
    index: int
    digest: bytes
    event_type: str
    event_data: Optional[bytes]

class AttestationQuoteData(NamedTuple):
    """Structured metadata accompanying a generated attestation quote.
    Used for predictable consumption by HETMVerifier."""
    platform_id: str
    quote_data: bytes
    signature: bytes
    nonce_match: bool
    timestamp: Optional[datetime]

PlatformMeasurementLog = List[MeasurementLogEntry]