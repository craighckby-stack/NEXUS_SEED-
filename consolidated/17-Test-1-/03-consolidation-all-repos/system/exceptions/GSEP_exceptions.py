class GSEPException(Exception):
    """Base exception for all GSEP errors. Standardizes error payload structure."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details if details is not None else {}

    def __str__(self):
        context_str = f" (Context: {self.details})" if self.details else ""
        return f"[{self.__class__.__name__}] {self.message}{context_str}"

class GSEPIntegrityBreach(GSEPException):
    """
    Raised when the Flag State Log (FSL) detects a critical internal state inconsistency, 
    memory corruption, or unexpected structural failure.
    """
    pass

class GSEPValidationFailure(GSEPIntegrityBreach):
    """Raised specifically when critical state verification or irreversible security invariants (e.g., P-01 Calculus) fail.
    Inherits from IntegrityBreach as this failure fundamentally compromises the system's verifiable state.
    """
    pass

class GSEPConfigurationError(GSEPException):
    """Raised when required agents, interfaces, or methods are missing, incompatible, or misconfigured in the architecture."""
    pass

class GSEPResourceConstraint(GSEPException):
    """Raised when the GSEP environment hits critical resource limits (e.g., compute budget, memory exhaustion, thread pool depletion)."""
    pass

class GSEPOperationalPolicyViolation(GSEPException):
    """Raised when execution adheres to code structure but violates high-level semantic policies or governance constraints."""
    pass