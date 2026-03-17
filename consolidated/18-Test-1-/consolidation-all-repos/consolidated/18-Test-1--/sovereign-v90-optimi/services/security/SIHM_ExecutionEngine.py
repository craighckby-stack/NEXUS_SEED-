import typing
from typing import Dict, Any, List, TYPE_CHECKING, Optional

# --- Manifest Structure Keys (Constants for Robustness) ---
class SIHMKeys:
    COMMAND = 'command'
    SEQUENCE_ID = 'sequence_id'
    REQUIRED_STATUS = 'required_status'
    PARAMETERS = 'parameters'
    HALT_ON_FAILURE = 'halt_on_failure'
    PRIORITY_LEVEL = 'priority_level'
    RESPONSE_PLAN = 'response_plan'
# ---------------------------------------------------------

# Forward declarations and Protocols
if TYPE_CHECKING:
    # Assuming these types exist in related services, ideally centralized in SIHM_Types
    from .SIHM_CommandResult import SIHM_CommandResult
    
    class CommandHandlerProtocol(typing.Protocol):
        def execute(self, **kwargs: Any) -> 'SIHM_CommandResult': ...

    class Context:
        def check_status(self, required_status: str) -> bool: ...
        def log_action(self, sequence_id: str, result: typing.Union[str, 'SIHM_CommandResult']) -> None: ...
        def log_error(self, message: str) -> None: ...
        def log_skip(self, message: str) -> None: ...
        def log_critical(self, message: str) -> None: ...

    class CommandRegistry:
        def get_isolated_commands(self) -> Dict[str, CommandHandlerProtocol]: ...


class SIHM_ExecutionEngine:
    """
    Isolated runtime engine for executing System Integrity Halt Manifest directives.
    Employs robust priority queuing, state checks, failure propagation, and exception handling.
    Uses SIHMKeys for explicit structural reference, improving robustness and maintainability.
    """

    def __init__(self, isolation_context: 'Context', command_registry: 'CommandRegistry'):
        self.context = isolation_context
        self.commands: Dict[str, 'CommandHandlerProtocol'] = command_registry.get_isolated_commands()
        self.registry = command_registry
        self._halt_triggered: bool = False

    def _handle_command_result(self, cmd_str: str, sequence_id: str, result: 'SIHM_CommandResult', halt_on_failure: bool) -> None:
        """Processes a structured command result (SIHM_CommandResult) for success/failure propagation."""
        self.context.log_action(sequence_id, result)

        # Use getattr with a safe default (True) for robustness against non-compliant result objects
        if not getattr(result, 'success', True):
            msg = getattr(result, 'message', 'No details provided.')
            self.context.log_error(f"Command failure: '{cmd_str}' ({sequence_id}). Message: {msg}")
            
            if halt_on_failure:
                self.context.log_critical(f"CRITICAL HALT: Sequence terminated due to mandatory result failure for '{cmd_str}'.")
                self._halt_triggered = True

    def _validate_directive(self, cmd_str: Optional[str], sequence_id: str) -> bool:
        """Ensures the directive is structurally valid and the command exists."""
        if not cmd_str:
            self.context.log_error(f"Directive ID {sequence_id} is missing a '{SIHMKeys.COMMAND}' identifier. Skipping.")
            return False

        if cmd_str not in self.commands:
            self.context.log_error(f"Unknown SIHM command: '{cmd_str}' ({sequence_id}). Skipping execution.")
            return False
            
        return True

    def _execute_command(self, cmd_str: str, sequence_id: str, params: Dict[str, Any], halt_on_failure: bool) -> None:
        """Attempts to run the command and handles results or exceptions."""
        try:
            command_handler = self.commands[cmd_str]
            # Expects a structured result
            result = command_handler.execute(**params)
            
            self._handle_command_result(cmd_str, sequence_id, result, halt_on_failure)
            
        except Exception as e:
            # Catch runtime/system exceptions during command invocation
            self.context.log_critical(f"FATAL EXCEPTION during '{cmd_str}' ({sequence_id}): {type(e).__name__}: {str(e)}")
            
            if halt_on_failure:
                self.context.log_critical(f"CRITICAL HALT: Sequence terminated due to mandatory exception halt for '{cmd_str}'.")
                self._halt_triggered = True

    def _process_directive(self, directive: Dict[str, Any]) -> None:
        """Handles the full lifecycle execution and logging for a single directive."""
        if self._halt_triggered:
            return

        # Use constants for explicit key access
        cmd_str = directive.get(SIHMKeys.COMMAND)
        sequence_id = directive.get(SIHMKeys.SEQUENCE_ID, 'SEQ_UNKNOWN')
        required_status = directive.get(SIHMKeys.REQUIRED_STATUS)
        params = directive.get(SIHMKeys.PARAMETERS, {})
        halt_on_failure = directive.get(SIHMKeys.HALT_ON_FAILURE, False)

        if not self._validate_directive(cmd_str, sequence_id):
            return

        # 1. Context Status Check
        if required_status and not self.context.check_status(required_status):
            self.context.log_skip(f"Status requirement failure ({required_status}) for '{cmd_str}' ({sequence_id}).")
            return

        # 2. Execution and Failure Handling
        self._execute_command(
            cmd_str=cmd_str,
            sequence_id=sequence_id,
            params=params,
            halt_on_failure=halt_on_failure
        )

    def execute_manifest(self, manifest_data: Dict[str, Any]) -> bool:
        """
        Executes the provided SIHM manifest response plan in strict priority order.
        Returns True if execution completed successfully without mandatory halting.
        """
        self._halt_triggered = False # Reset state for new execution run
        response_plan: List[Dict[str, Any]] = manifest_data.get(SIHMKeys.RESPONSE_PLAN, [])

        if not response_plan:
            self.context.log_action("N/A", "Manifest provided no response plan. Exiting early.")
            return True
            
        # 1. Structural Sort
        try:
            response_plan.sort(
                key=lambda x: int(x.get(SIHMKeys.PRIORITY_LEVEL, 0) or 0), 
                reverse=True
            )
        except (TypeError, ValueError) as e:
            self.context.log_critical(f"Manifest plan sorting failed due to invalid priority type: {e}. Halting initialization.")
            return False

        # 2. Sequential Execution
        for directive in response_plan:
            self._process_directive(directive)
            
            if self._halt_triggered:
                break 
                    
        return not self._halt_triggered