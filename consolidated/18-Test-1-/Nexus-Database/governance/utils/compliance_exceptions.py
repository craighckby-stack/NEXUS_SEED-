class ComplianceError(Exception):
    """Raised when STES governance standards are strictly violated."""
    pass

class ComplianceWarning(Exception):
    """Raised when standards are marginally missed but operation can continue."""
    pass
