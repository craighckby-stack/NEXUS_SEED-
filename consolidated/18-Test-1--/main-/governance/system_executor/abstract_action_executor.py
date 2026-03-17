from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
# Import necessary type definitions for strict action contracts
from .action_types import ActionType, ActionPayload, ExecutionResult

# Type alias for general system context which is typically unstructured
SystemContext = Dict[str, Any]

class AbstractSystemActionExecutor(ABC):
    """
    Defines the standardized contract for executing governance enforcement actions.
    Implementations must inherit this class and handle delegation based on ActionType.

    The introduction of the 'execute' method enforces the Command Pattern, 
    decoupling the caller from specific execution details.
    """

    @abstractmethod
    def execute(self,
                action_type: ActionType,
                payload: ActionPayload,
                context: SystemContext
                ) -> ExecutionResult:
        """
        The central entry point for executing any defined enforcement action.
        Concrete implementations must delegate processing based on the action_type
        to the appropriate protected helper method (e.g., _isolate_process).
        """
        pass

    # --- Protected Action Implementation Methods ---
    # These methods define the granular actions and are typically called internally by 'execute'.

    @abstractmethod
    def _isolate_process(self, payload: ActionPayload, context: SystemContext) -> ExecutionResult:
        """Isolates the identified faulty process/entity (network, resource, access restrictions)."""
        pass

    @abstractmethod
    def _trigger_root_audit(self, payload: ActionPayload, context: SystemContext) -> ExecutionResult:
        """Initiates a deep, low-level audit based on violation context."""
        pass

    @abstractmethod
    def _notify_human(self, payload: ActionPayload, context: SystemContext) -> ExecutionResult:
        """Sends alerts to human operators (via pager, email, slack)."""
        pass

    @abstractmethod
    def _throttle_quota(self, payload: ActionPayload, context: SystemContext) -> ExecutionResult:
        """Limits resource usage for the identified entity."""
        pass

    @abstractmethod
    def _revert_state(self, payload: ActionPayload, context: SystemContext) -> ExecutionResult:
        """Attempts rollback to a known good state or snapshot."""
        pass

    @abstractmethod
    def _retry_processing(self, payload: ActionPayload, context: SystemContext) -> ExecutionResult:
        """Reschedules the current task or workload for retry after potential fix."""
        pass