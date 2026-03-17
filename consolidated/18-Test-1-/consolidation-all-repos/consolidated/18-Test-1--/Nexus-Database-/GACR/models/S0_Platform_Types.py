from typing import NamedTuple, List, Optional
from datetime import datetime

# --- Sovereign AGI GACR Measurement Data Types ---

class MeasurementLogEntry(NamedTuple):
    """Represents a single entry in a cryptographic Measurement Log (e.g., TCG log structure)."""
    index: int                  # PCR Index (or equivalent secure index)
    digest: bytes               # Measured hash/digest
    event_type: str             # Semantic type (e.g., 'BOOT_POLICY', 'FIRMWARE_CONFIG')
    event_data: Optional[bytes] # Optional raw event data

class AttestationQuoteData(NamedTuple):
    """Structured metadata accompanying a generated attestation quote.
    Used for predictable consumption by HETMVerifier."""
    platform_id: str            # Unique identity of the measured device
    quote_data: bytes           # Signed quote payload (raw structure)
    signature: bytes            # Signature over the quote_data
    nonce_match: bool           # Confirmation that the requested nonce was incorporated
    timestamp: Optional[datetime] # Time reported by the secure element (if available)

PlatformMeasurementLog = List[MeasurementLogEntry]