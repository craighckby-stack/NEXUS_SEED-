from typing import Dict
from utilities.analysis.MetricAnalyzer import MetricAnalyzer

class DynamicTuner:
    """
    Orchestration component responsible for receiving metric analysis results and translating 
    them into actionable configuration changes for the Global Threshold Configuration Module (GTCM).
    
    Handles validation, clamping (Min/Max safety checks), and application of new thresholds.
    """
    
    def __init__(self, history_data: Dict[str, list], config_service):
        self.analyzer = MetricAnalyzer(smoothing_window=15) 
        self.history = history_data
        self.config_service = config_service # Placeholder for system configuration interface
        
        # Define safety bounds to prevent statistically derived values from violating hard system limits
        self.S01_MIN_HARD_FLOOR = 0.50 # e.g., never allow efficiency below 50%
        self.S02_MAX_HARD_CEILING = 10.0 # e.g., never allow exposure above 10.0

    def execute_threshold_adjustment(self) -> Dict[str, float]:
        """
        Runs analysis and applies the suggested thresholds, respecting safety bounds.
        """
        suggestions = self.analyzer.analyze_gtcm_performance(self.history)
        applied_changes = {}
        
        # Apply S-01 Floor adjustment (Utility/Efficiency)
        if 'suggested_s01_floor' in suggestions:
            new_floor = max(suggestions['suggested_s01_floor'], self.S01_MIN_HARD_FLOOR)
            # self.config_service.update('GTCM_S01_UTILITY_MIN', new_floor) # Hypothetical config update
            applied_changes['GTCM_S01_UTILITY_MIN'] = round(new_floor, 4)
            
        # Apply S-02 Ceiling adjustment (Exposure/Risk)
        if 'suggested_s02_ceiling' in suggestions:
            new_ceiling = min(suggestions['suggested_s02_ceiling'], self.S02_MAX_HARD_CEILING)
            # self.config_service.update('GTCM_S02_EXPOSURE_MAX', new_ceiling) # Hypothetical config update
            applied_changes['GTCM_S02_EXPOSURE_MAX'] = round(new_ceiling, 4)
            
        return applied_changes

