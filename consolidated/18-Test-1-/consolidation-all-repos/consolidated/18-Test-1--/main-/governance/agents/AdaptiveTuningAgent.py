import json
from datetime import datetime

GOVERNING_PARAMS_PATH = "../config/MCRE_GoverningParameters.json"
ADJUSTMENT_BOUNDS = {
    "trigger_MRA_delta": {"min": 0.010, "max": 0.025, "step": 0.001}
}

class AdaptiveTuningAgent:
    """Dynamically adjusts non-critical MCRE parameters within GCO-defined safe bounds.
    
    Operates on P-Variance metrics to optimize efficiency without violating safety thresholds.
    """
    def __init__(self, config_path=GOVERNING_PARAMS_PATH):
        self.config_path = config_path
        self._load_config()

    def _load_config(self):
        with open(self.config_path, 'r') as f:
            self.config = json.load(f)

    def _save_config(self):
        # Update metadata timestamp on save
        self.config['metadata']['last_reviewed'] = datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')
        with open(self.config_path, 'w') as f:
            json.dump(self.config, f, indent=2)

    def analyze_p_variance(self, current_variance):
        """Analyze performance variance and propose adjustments if warranted."""
        
        current_delta = self.config['threshold_management']['trigger_MRA_delta']['value']
        bounds = ADJUSTMENT_BOUNDS['trigger_MRA_delta']
        adjusted = False
        
        if current_variance > 0.9 and current_delta < bounds['max']:
            # High performance: increase delta (allow more risk) to push optimization
            new_delta = round(min(current_delta + bounds['step'], bounds['max']), 4)
            self.propose_adjustment("trigger_MRA_delta", new_delta, "Increased delta due to sustained high P-Variance score.")
            adjusted = True

        elif current_variance < 0.2 and current_delta > bounds['min']:
            # Low performance/instability: reduce delta (increase safety margin)
            new_delta = round(max(current_delta - bounds['step'], bounds['min']), 4)
            self.propose_adjustment("trigger_MRA_delta", new_delta, "Reduced delta due to low P-Variance score, increasing stability margin.")
            adjusted = True

        return adjusted

    def propose_adjustment(self, key, new_value, rationale):
        """Applies adjustment and updates config file."""
        
        target = self.config['threshold_management'][key] 
        old_value = target['value']
        target['value'] = new_value
        print(f"[{datetime.now().isoformat()}] ATA Adjustment: {key} updated {old_value} -> {new_value}. Rationale: {rationale}")
        
        self._save_config()

# NOTE: Orchestration logic (e.g., periodic run, metric ingestion) not included in scaffold.