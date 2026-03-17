from typing import Optional

class PolicyRegistryError(Exception):
    """Base exception for Policy Registry Client operations."""
    pass

class RegistryConnectionError(PolicyRegistryError):
    """Raised when communication with the external Policy Registry fails."""
    def __init__(self, endpoint: str, status_code: Optional[int] = None, message: str = "Connection failed"):
        self.endpoint = endpoint
        self.status_code = status_code
        super().__init__(f"{message} on endpoint {endpoint} (Status: {status_code or 'N/A'})")

class PolicyNotFoundError(PolicyRegistryError):
    """Raised when the requested policy schema or constraint definition is missing."""
    def __init__(self, key_id: str, version: str):
        super().__init__(f"Requested resource not found: ID='{key_id}', Version='{version}'")

class InvalidPolicySchemaError(PolicyRegistryError):
    """Raised when the retrieved policy schema fails internal validation checks."""
    pass