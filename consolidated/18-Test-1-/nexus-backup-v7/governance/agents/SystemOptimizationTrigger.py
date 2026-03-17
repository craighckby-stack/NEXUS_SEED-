# governance/agents/SystemOptimizationTrigger.py

import json
from governance.protocols.GSEP import L0_INITIALIZATION_PATH
from governance.metrics.SCR_Config import SystemHealthMetrics

class SystemOptimizationTrigger:
    """
    SOT monitors system health and performance indicators (SHMs) and autonomously 
    generates a System State Transition (SST) proposal artifact if performance 
    degrades or a known optimization vector is accessible. 
    This acts as the internal impetus for GSEP initiation, closing the self-evolution loop.
    """
    
    def __init__(self, sdr_interface, scr_registry):
        self.sdr = sdr_interface  # Source for S-01 (Efficacy) data, and raw health metrics
        self.scr = scr_registry   # Source for System Health Metric (SHM) Thresholds
        self.monitoring_active = True
        
    def check_health_metrics(self):
        """Monitors key SHMs against SCR thresholds using real-time data from SDR."""
        metrics = self.sdr.get_recent_performance_data()
        thresholds = self.scr.get_shm_thresholds()
        
        proposals_needed = []
        for metric, data in metrics.items():
            if metric in thresholds and data['value'] < thresholds[metric]['min_optimal']:
                proposals_needed.append(metric)
                
        return proposals_needed
        
    def generate_initial_proposal(self, optimization_vectors):
        """Generates the raw SST proposal artifact routed to L0."""
        if not optimization_vectors:
            return None

        # Basic, unvalidated manifest
        proposal_artifact = {
            "origin_agent": "SOT",
            "timestamp": self.sdr.get_current_time(),
            "trigger_reason": f"System metrics dropped below optimal threshold: {', '.join(optimization_vectors)}",
            "scope_type": "INTERNAL_OPTIMIZATION",
            "payload_draft": "Placeholder: Detailed plan derived from metric discrepancy.",
            "target_gsep_path": "L0_INITIALIZATION_PATH"
        }
        
        # Placeholder for actual routing mechanism
        # L0_INITIALIZATION_PATH.receive(artifact)
        print(f"[SOT] Triggered evolution due to {len(optimization_vectors)} metric breaches. Routing proposal to L0 validation.")
        return proposal_artifact
        
    def run_cycle(self):
        while self.monitoring_active:
            optimization_triggers = self.check_health_metrics()
            if optimization_triggers:
                self.generate_initial_proposal(optimization_triggers)
            # time.sleep(self.scr.get_monitoring_interval())
