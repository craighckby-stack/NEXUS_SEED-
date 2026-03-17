from typing import Dict, Any, Optional
from dataclasses import dataclass, field

@dataclass(frozen=True)
class SIHM_CommandResult:
    """Standardized result structure for SIHM Command execution, necessary for reliable failure propagation."""
    success: bool
    command_name: str
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    
    # Optional status code for detailed telemetry and integration with external systems
    status_code: Optional[int] = None 
    
    @classmethod
    def success_result(cls, command_name: str, message: str = "Execution successful.", details: Optional[Dict[str, Any]] = None) -> 'SIHM_CommandResult':
        return cls(
            success=True, 
            command_name=command_name, 
            message=message, 
            details=details if details is not None else {}
        )

    @classmethod
    def failure_result(cls, command_name: str, reason: str, details: Optional[Dict[str, Any]] = None, status_code: Optional[int] = None) -> 'SIHM_CommandResult':
        return cls(
            success=False, 
            command_name=command_name, 
            message=reason, 
            details=details if details is not None else {},
            status_code=status_code
        )