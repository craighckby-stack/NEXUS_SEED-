from pydantic import BaseModel, Field, conint
from typing import Optional, List

class PolicyConfigurationModel(BaseModel):
    """Structured model for the Autonomous Configuration Validation Data (ACVD).
    Defines schema, types, and mathematical constraints for governing state configuration.
    """
    
    ACVD_THRESHOLD: conint(ge=0) = Field(
        description="The primary state reconciliation efficiency metric threshold. Must be non-negative.",
        default=0
    )
    
    POLICY_VERSION: str = Field(
        description="Version hash or identifier of the loaded policy, essential for rollback assurance.",
        min_length=5
    )
    
    CRITICAL_SERVICE_LIST: List[str] = Field(
        description="List of services critical for CRoT execution and must be running/available."
    )
    
    CHECKSUM_SHA256: Optional[str] = Field(
        description="Cryptographic checksum of the full configuration payload for external integrity validation."
    )

# Future models can be added here, e.g., for run-time policy parameters.
