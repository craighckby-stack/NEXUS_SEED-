from typing import Dict, Any, Optional, List, Protocol
import math
import logging

# Assuming a structured logging mechanism is configured upstream
logger = logging.getLogger(__name__)

# --- Protocols (Should ideally be imported from interfaces/history_db_protocol.py) ---

class HistoryDBConnector(Protocol):
    def query(self, sql: str, params: tuple) -> List[Dict[str, Any]]:
        ...

class ConfigManager(Protocol):
    def get_config(self) -> Dict[str, Any]:
        ...
    def save_config(self, config: Dict[str, Any]) -> None:
        ...


class StageBaselineManager:
    """
    Calculates and applies optimized performance baselines (latency, resource use) 
    for GSEP stages based on historical execution data, feeding results back to 
    the system configuration.
    
    Fulfills Mandate P-M01 by ensuring max targets are dynamically derived and adjusted.
    """
    
    # Static mapping of metrics retrieved from the DB to the specific config field they control
    _CONFIG_FIELD_MAPPING = {
        'duration_ms': 'max_duration_ms',
        # Extending to non-duration metrics for future compatibility
        'cpu_utilization': 'max_cpu_percent',
        'memory_bytes': 'max_memory_bytes'
    }
    
    # Define standard allowed metrics and their default calculation method
    BASELINE_METHODS = {
        'duration_ms': 'P95',
        'cpu_utilization': 'P90',
        'memory_bytes': 'P99'
    }

    def __init__(self, history_db_connector: HistoryDBConnector, config_manager: ConfigManager):
        """
        Initializes the manager with dependencies.
        :param history_db_connector: Protocol defining historical execution data access.
        :param config_manager: Protocol defining system configuration utility.
        """
        self.db = history_db_connector
        self.config_manager = config_manager

    @staticmethod
    def _calculate_percentile(values: List[float], method: str) -> Optional[float]:
        """
        Calculates the percentile value using the Nearest Rank method, favoring a conservative 
        (higher value) calculation by rounding up the index.
        """
        if not values:
            return None
        
        N = len(values)
        method = method.upper()

        if method.startswith('P') and method[1:].isdigit():
            try:
                percentile_rank = int(method[1:]) / 100.0
            except ValueError:
                logger.warning(f"Invalid percentile rank in method: {method}")
                return None

            # Index = ceil(N * P) - 1 for 0-based indexing.
            index = math.ceil(N * percentile_rank) - 1
            
            # Ensure index is within bounds [0, N-1]
            safe_index = min(max(0, index), N - 1)
            
            return values[safe_index]
        
        logger.warning(f"Unknown statistical method requested: {method}")
        return None

    def calculate_baseline(self, stage_id: str, metric: str, method: str, min_samples: int = 50) -> Optional[float]:
        """
        Calculates the performance baseline for a given stage.
        """
        
        try:
            # Use safe parameter binding defined in the HistoryDBConnector protocol
            query = f"SELECT {metric} FROM executions WHERE stage = %s AND success = true ORDER BY timestamp DESC LIMIT 500"
            history: List[Dict[str, Any]] = self.db.query(query, (stage_id,))
        except Exception as e:
            logger.error(f"DB retrieval failed for stage {stage_id}, metric {metric}: {e}")
            return None

        if not history or len(history) < min_samples:
            logger.info(f"Insufficient data ({len(history)} samples) for stage {stage_id}. Min required: {min_samples}")
            return None

        # Extract, filter, and sort values
        try:
            # Filter for valid numeric values associated with the metric key
            values = sorted([float(h[metric]) for h in history if isinstance(h.get(metric), (int, float))])
        except (KeyError, ValueError) as e:
            logger.error(f"Data conversion/structure error for stage {stage_id}, metric {metric}: {e}")
            return None

        return self._calculate_percentile(values, method)


    def update_config_soft_targets(self, calculation_margin: float = 1.1, buffer_tolerance: float = 0.1) -> bool:
        """
        Iterates through configurable stages and metrics defined in BASELINE_METHODS,
        calculates new baselines, and applies updates to the configuration's soft targets.
        
        :param calculation_margin: Multiplier applied to the calculated baseline (safety buffer).
        :param buffer_tolerance: The relative drift (e.g., 0.1 for 10%) allowed before automatically adjusting the target upwards.
        :return: True if the configuration was modified and saved.
        """
        config = self.config_manager.get_config()
        config_updated = False
        stages = config.get('stages', {})
        
        for stage_id, stage_config in stages.items():
            
            # Iterate over all defined metrics (duration, cpu, memory, etc.)
            for metric, method in self.BASELINE_METHODS.items():
                
                config_key = self._CONFIG_FIELD_MAPPING.get(metric)
                
                if config_key and config_key in stage_config:
                    
                    baseline = self.calculate_baseline(
                        stage_id=stage_id, 
                        metric=metric, 
                        method=method
                    )
                    
                    if baseline is not None:
                        # Apply safety margin to the observed baseline
                        new_target = round(baseline * calculation_margin)
                        current_target = stage_config[config_key]
                        
                        if not isinstance(current_target, (int, float)):
                            logger.warning(f"Config target for {stage_id}.{config_key} is not numeric. Skipping update.")
                            continue

                        
                        # 1. Improvement detection: Lower the target immediately
                        if new_target < current_target:
                            stage_config[config_key] = new_target
                            config_updated = True
                            logger.info(f"Target lowered for {stage_id}.{config_key} ({metric}): {current_target} -> {new_target}")
                            
                        # 2. Significant degradation detection: Adjust target upwards to prevent continuous alerts
                        elif new_target > (current_target * (1 + buffer_tolerance)): 
                            stage_config[config_key] = new_target
                            config_updated = True
                            logger.warning(f"Target raised (drift detected) for {stage_id}.{config_key} ({metric}): {current_target} -> {new_target}")

        
        if config_updated:
            self.config_manager.save_config(config)
            logger.info("Configuration baselines updated and saved.")
            return True
        
        return False