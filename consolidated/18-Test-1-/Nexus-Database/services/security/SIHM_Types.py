from typing import Dict, Any, Protocol
from dataclasses import dataclass

@dataclass(frozen=True)
class SIHM_CommandResult:
    """
    Standardized, immutable result structure for all System Integrity Halt Manifest commands.
    Ensures robust failure detection and logging, mandatory for the execution engine.
    """
    success: bool
    message: str
    data: Dict[str, Any] # Detailed output or metrics

class CommandHandlerProtocol(Protocol):
    """
    Protocol defining the required interface for any command registered in the SIHM system.
    This ensures dependency inversion and strict type checking for execution handlers.
    """
    def execute(self, **kwargs: Any) -> SIHM_CommandResult:
        """
        Executes the command with provided parameters and returns a structured SIHM_CommandResult.
        """
        ...
