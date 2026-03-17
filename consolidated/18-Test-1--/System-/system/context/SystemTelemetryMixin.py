import abc
from system.context.SystemTelemetryProxy import (
    SystemTelemetryProxy, SystemTelemetrySnapshot, 
    ResourceForecast, OperationalConstraints, 
    SystemPerformanceIndicators, EvolutionaryContext
)

# --- Configuration for Recursive Abstraction ---
_FIELD_MAP = {
    "get_resource_forecast": ('forecast', ResourceForecast),
    "get_operational_constraints": ('constraints', OperationalConstraints),
    "get_performance_indicators": ('performance', SystemPerformanceIndicators),
    "get_evolutionary_context": ('evolution_context', EvolutionaryContext),
}

def _make_accessor(key: str, return_type):
    """Generates a high-efficiency delegated getter function."""
    def accessor(self) -> return_type:
        # NOTE: Computational efficiency relies on subclasses optimizing 
        # get_full_snapshot() (e.g., internal caching). This factory optimizes 
        # abstraction by eliminating method boilerplate.
        return self.get_full_snapshot()[key]
    
    accessor.__doc__ = f"Delegated retrieval of '{key}' from the atomic snapshot."
    return accessor
# -----------------------------------------------

class SystemTelemetryMixin(SystemTelemetryProxy, abc.ABC):
    """
    Abstract Base Mixin leveraging recursive abstraction to provide component 
    accessors by mandating and delegating through the atomic get_full_snapshot() 
    method.
    
    This design optimizes for abstraction efficiency, centralizing the delegation 
    pattern for all telemetry fields.
    """

    @abc.abstractmethod
    def get_full_snapshot(self) -> SystemTelemetrySnapshot:
        """
        Must be implemented by the subclass to retrieve the latest atomic snapshot.
        This call should be computationally inexpensive (e.g., internally cached)
        if multiple telemetry components are required concurrently.
        """
        raise NotImplementedError

# Dynamic injection of accessors using the factory pattern
for method_name, (key, return_type) in _FIELD_MAP.items():
    setattr(SystemTelemetryMixin, method_name, _make_accessor(key, return_type))