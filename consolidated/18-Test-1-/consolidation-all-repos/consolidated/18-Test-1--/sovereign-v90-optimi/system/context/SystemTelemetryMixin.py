import abc
from system.context.SystemTelemetryProxy import (
    SystemTelemetryProxy, SystemTelemetrySnapshot, 
    ResourceForecast, OperationalConstraints, 
    SystemPerformanceIndicators, EvolutionaryContext
)

class SystemTelemetryMixin(SystemTelemetryProxy, abc.ABC):
    """
    Abstract Base Mixin providing default, consistent implementation for component 
    accessors by mandating the use of the atomic get_full_snapshot() method.

    Concrete implementations must inherit from this Mixin and implement the 
    abstract method get_full_snapshot().
    """

    @abc.abstractmethod
    def get_full_snapshot(self) -> SystemTelemetrySnapshot:
        """
        Must be implemented by the subclass to retrieve the latest atomic snapshot.
        """
        raise NotImplementedError

    def get_resource_forecast(self) -> ResourceForecast:
        """Delegated retrieval from the atomic snapshot."""
        return self.get_full_snapshot()['forecast']

    def get_operational_constraints(self) -> OperationalConstraints:
        """Delegated retrieval from the atomic snapshot."""
        return self.get_full_snapshot()['constraints']

    def get_performance_indicators(self) -> SystemPerformanceIndicators:
        """Delegated retrieval from the atomic snapshot."""
        return self.get_full_snapshot()['performance']

    def get_evolutionary_context(self) -> EvolutionaryContext:
        """Delegated retrieval from the atomic snapshot."""
        return self.get_full_snapshot()['evolution_context']