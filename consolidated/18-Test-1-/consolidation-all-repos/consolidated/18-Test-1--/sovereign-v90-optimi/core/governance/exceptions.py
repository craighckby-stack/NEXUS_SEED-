class GovernanceError(Exception):
    """Base exception for all governance-related issues."""
    pass

class SystemGovernanceError(GovernanceError):
    """Raised when core system constants or configurations violate defined constraints."""
    pass

# Future exceptions can include: 
# class PolicyViolationError(GovernanceError): pass
# class SanityCheckFailure(GovernanceError): pass