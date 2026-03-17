import enum
from typing import Optional

class TestResult(enum.Enum):
    """
    Defines the possible outcomes of a validation test run, with improved
    granularity for failure modes and added utility properties.
    """
    
    # Primary Success/Skipped States
    SUCCESS = "Test Succeeded (200)"
    SKIPPED = "Test Skipped/Environment Inapplicable"
    
    # Infrastructure/Setup Failure States (Often indicates environment issues)
    FORBIDDEN = "Access Denied (403)"
    TIMEOUT = "Execution Timed Out"
    REDIRECT = "Requires Follow-up (Redirect/3xx)"
    
    # Primary Test Failure States
    ASSERTION_FAILURE = "Assertion Failed (Mismatch)"
    EXECUTION_ERROR = "Unhandled Runtime Exception"
    
    @property
    def is_successful(self) -> bool:
        """Checks if the result represents a successful or passing outcome (including skipped)."""
        return self in (TestResult.SUCCESS, TestResult.SKIPPED)

    @property
    def is_critical_failure(self) -> bool:
        """Checks if the result represents a primary failure mode (assertion or execution error)."""
        return self in (TestResult.ASSERTION_FAILURE, TestResult.EXECUTION_ERROR)
        
    @property
    def is_environmental_error(self) -> bool:
        """Checks if the result represents an error likely caused by environment or access issues (e.g., 403, timeout)."""
        return self in (TestResult.FORBIDDEN, TestResult.TIMEOUT, TestResult.REDIRECT)

    def get_status_category(self) -> str:
        """Returns a high-level category string for reporting."""
        if self.is_successful:
            return 'PASS'
        if self.is_critical_failure:
            return 'FAIL'
        if self == TestResult.REDIRECT:
            return 'WARN'
        return 'ERROR'