from typing import Final
import os

class SecuritySettings:
    """
    Centralized repository for critical security configuration parameters.
    This decouples operational code (like IntegrityHashValidator) from environmental standards.
    """
    
    # Default algorithm for payload integrity validation
    DEFAULT_INTEGRITY_ALGORITHM: Final[str] = "sha256"
    
    # Example: Security measure for API throttling limits
    MAX_REQUESTS_PER_MINUTE: Final[int] = 120

    @staticmethod
    def get_integrity_algorithm() -> str:
        """Retrieves the configured integrity algorithm, prioritizing environment variables.
        """
        return os.environ.get(
            'AGI_INTEGRITY_ALGORITHM',
            SecuritySettings.DEFAULT_INTEGRITY_ALGORITHM
        ).lower()