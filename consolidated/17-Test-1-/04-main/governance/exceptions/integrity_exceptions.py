class GovernanceException(Exception):
    """Base class for all governance-related operational errors."""
    pass

class IntegrityHalt(GovernanceException):
    """
    P-M02: Raised specifically when a fundamental integrity constraint 
    (like policy immutability or runtime hash validation) is violated, 
    requiring immediate system lockdown or state machine reset.
    """
    pass

class PolicyViolation(GovernanceException):
    """
    P-Mxx: Raised for policy breaches that may not necessitate an immediate 
    Integrity Halt but require severe mitigation steps.
    """
    pass