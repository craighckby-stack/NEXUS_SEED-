"""Custom exceptions for the Axiomatic Data Exchange Protocol (ADEP), providing structured error handling for governance components."""

class ADEPError(Exception):
    """Base exception for all ADEP related errors."""
    pass

class ADEPValidationFailure(ADEPError):
    """Raised when data payload fails schema validation during DSE Handoff."""
    pass

class ADEPSynchronizationError(ADEPError):
    """Raised when a required lock acquisition or synchronization primitive fails, indicating a contention or storage infrastructure fault."""
    pass
