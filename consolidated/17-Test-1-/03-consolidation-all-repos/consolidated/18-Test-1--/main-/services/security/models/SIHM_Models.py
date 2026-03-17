from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

@dataclass
class SIHMDirective:
    """Defines the validated data structure for a single command directive."""
    command: str
    sequence_id: str = field(default="SEQ_AUTO")
    priority_level: int = field(default=0)
    halt_on_failure: bool = field(default=False)
    required_status: Optional[str] = field(default=None)
    parameters: Dict[str, Any] = field(default_factory=dict)
    
@dataclass
class SIHMManifest:
    """Defines the validated top-level structure of the Halt Manifest payload."""
    manifest_id: str
    trigger_event: str
    response_plan: List[SIHMDirective] = field(default_factory=list)