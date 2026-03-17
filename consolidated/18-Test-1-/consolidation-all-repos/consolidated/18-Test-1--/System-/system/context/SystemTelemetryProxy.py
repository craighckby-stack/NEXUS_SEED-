from typing import Protocol, TypedDict, Literal

# --- Contextual Literals (Improving Security/Clarity) ---

SecurityMode = Literal['PERMISSIVE', 'LOCKED', 'AUDIT_ONLY', 'EMERGENCY_SHUTDOWN']
ExecutionPhase = Literal['STANDBY', 'PLANNING', 'EVOLVING', 'TESTING', 'DEPLOYING']

# --- Strict Definitions for Telemetry Payloads ---

class ResourceForecast(TypedDict):
    """Predicted resource utilization for the upcoming evolution cycle."""
    cpu_load_baseline: float      # Projected CPU usage (0.0 to 1.0, weighted avg)
    memory_headroom_gb: float     # Available RAM headroom in GB (remaining)
    io_latency_p95_ms: float      # Projected 95th percentile I/O latency (ms)
    disk_utilization_ratio: float # Projected storage saturation (0.0 to 1.0)
    network_egress_bps: int       # Projected network egress (bits per second)
    confidence_score: float       # Model's confidence in this forecast (0.0 to 1.0)

class OperationalConstraints(TypedDict):
    """Current explicit operational and environmental constraints."""
    max_concurrency: int          # Maximum parallel operations allowed (system ceiling)
    active_version_id: str        # The ID of the currently executing AGI version
    security_mode: SecurityMode   # Current security posture
    storage_read_only: bool       # True if persistent storage modification is disallowed
    execution_timeout_s: float    # Max time allotted for complex evolutionary tasks
    current_execution_phase: ExecutionPhase # Current phase of the evolutionary lifecycle

class EvolutionaryContext(TypedDict):
    """Metrics related specifically to the Autonomous Code Evolution (ACE) cycle success."""
    evolution_cycle_success_rate: float # Proportion of successful evolutionary merges (0.0 to 1.0)
    median_test_coverage_ratio: float   # Median coverage of evolved code segments
    median_evolution_latency_s: float   # Time taken for a typical evolutionary loop (seconds)
    cumulative_rollback_count: int      # Total number of times self-evolution was rolled back
    current_debt_ratio: float           # Technical debt incurred vs. mitigated in the cycle (0.0 to 1.0)
    
class SystemPerformanceIndicators(TypedDict):
    """Real-time performance metrics and health status."""
    error_rate_p1m: float         # Percentage of operational errors in the past minute (0.0 to 1.0)
    thermal_status_celsius: float # Current key component thermal reading (C)
    queue_depth_max: int          # Maximum length across all pending task queues observed
    uptime_seconds: int           # Total system uptime
    self_correction_attempts_p1h: int # Number of self-correction loops executed recently
    external_network_latency_ms: float # Avg latency to critical external services/repos (ms)
    estimated_cost_p1h: float     # Estimated operational cost (local currency/hour)
    resource_contention_index: float # Severity of observed resource throttling/locking (0.0 to 1.0)

# --- Cohesive Snapshot Definition ---

class SystemTelemetrySnapshot(TypedDict):
    """
    A full, instantaneous snapshot of all critical system telemetry required for 
    Autonomous Code Evolution (ACE) decision making. Timestamp uses ISO 8601 UTC.
    """
    timestamp_utc: str                    # UTC ISO timestamp of snapshot capture
    forecast: ResourceForecast
    constraints: OperationalConstraints
    performance: SystemPerformanceIndicators
    evolution_context: EvolutionaryContext

# --- The Telemetry Proxy Protocol ---

class SystemTelemetryProxy(Protocol):
    """
    Contract interface for fetching real-time and projected system operational 
    context (SCR inputs). Implementations must ensure that get_full_snapshot() 
    provides temporally consistent data across all its contained components.
    """

    def get_full_snapshot(self) -> SystemTelemetrySnapshot:
        """
        Retrieves a complete, structured snapshot of all telemetry data points in a 
        single atomic operation. This is the preferred access method.
        """
        ...
        
    # Component-specific accessors: Mandatory for structural consistency.
    # Implementations are strongly encouraged to delegate these to fields 
    # of the SystemTelemetrySnapshot to ensure temporal alignment.
    
    def get_resource_forecast(self) -> ResourceForecast:
        """Provides strictly typed projected resource utilization metrics."""
        ...

    def get_operational_constraints(self) -> OperationalConstraints:
        """Fetches current explicit, mandatory operational constraints."""
        ...
    
    def get_performance_indicators(self) -> SystemPerformanceIndicators:
        """Retrieves current real-time system performance health metrics."""
        ...
        
    def get_evolutionary_context(self) -> EvolutionaryContext:
        """Retrieves data specific to the success and speed of ACE cycles."""
        ...
