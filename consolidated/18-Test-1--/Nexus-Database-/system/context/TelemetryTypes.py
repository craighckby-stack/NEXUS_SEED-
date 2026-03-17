from typing import TypedDict, Literal, Dict

# --- Type Definitions for Contract Enforcement ---

class ResourceForecast(TypedDict):
    """Defines the rigid schema for resource utilization forecasts.
    All keys must conform to the SystemTelemetryProxy contract."""
    cpu_load_baseline: float
    memory_headroom: float
    # Note: This key must match the external system contract, despite non-standard character usage.
    'i/o_latency_p95': float 

SecurityMode = Literal["Hardened", "Development", "Permissive"]

class ConstraintStatus(TypedDict):
    """Defines the rigid schema for operational constraints and system status."""
    MAX_CONCURRENCY: int
    ACTIVE_VERSION_ID: str
    SECURITY_MODE: SecurityMode

# --- Utility Types ---

TelemetryData = Dict[str, Dict]
