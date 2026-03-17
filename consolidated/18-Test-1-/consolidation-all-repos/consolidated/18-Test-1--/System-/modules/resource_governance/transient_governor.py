class TransientResourceGovernor:
    """Enforces operational constraints read from TACU configuration to prevent the checkpointing process itself from causing system instability."""

    def __init__(self, config_path: str = 'config/tacu_checkpoint_config.json'):
        self.config = self._load_config(config_path)
        self.max_cpu_ms = self.config['frequency_settings']['max_impact_cpu_ms']
        self.isolation_budget = self.config['frequency_settings']['p_m01_isolation_budget_ms']

    def _load_config(self, path):
        # Implementation required to securely load and parse the JSON config
        pass

    def assess_checkpoint_impact(self, current_cpu_usage_ms: float) -> bool:
        """Returns True if checkpoint execution is permissible based on current constraints."""
        if current_cpu_usage_ms > self.max_cpu_ms:
            # Log alert: TACU threshold exceeded
            return False
        return True

    def monitor_isolation_window(self, elapsed_time_ms: int) -> bool:
        """Checks if the operation is still within the P-M01 isolation time budget."""
        return elapsed_time_ms < self.isolation_budget
