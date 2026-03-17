class SystemGovernanceError(Exception):
    """Base exception for failures during the governance validation or runtime configuration enforcement process."""
    def __init__(self, message, domain=None, key=None):
        self.domain = domain
        self.key = key
        super().__init__(message)