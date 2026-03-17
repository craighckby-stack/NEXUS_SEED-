from enum import Enum
from typing import TypedDict, Any, Dict, Optional

class ActionType(str, Enum):
    """Enumeration of standard enforcement actions supported by the system."""
    ISOLATE_PROCESS = "isolate_process"
    TRIGGER_ROOT_AUDIT = "trigger_root_audit"
    NOTIFY_HUMAN = "notify_human"
    THROTTLE_QUOTA = "throttle_quota"
    REVERT_STATE = "revert_state"
    RETRY_PROCESSING = "retry_processing"

class ActionPayload(TypedDict, total=False):
    """Standardized input structure for any system action."""
    entity_id: str
    resource: str
    reason: str
    metadata: Dict[str, Any]

class ExecutionResult(TypedDict):
    """Standardized output structure for any system action execution."""
    success: bool
    status_code: int
    message: str
    details: Optional[Dict[str, Any]]