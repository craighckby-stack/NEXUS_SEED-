# Resource Demand Manager (RDM) - DSP-C Optimization Utility

import os
import json
import logging
from typing import Dict, Any

# Setup Logging for RDM
logging.basicConfig(level=logging.INFO, format='[RDM_Opt] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class RDM_Optimizer:
    """
    Dynamically adjusts DSP-C parameters based on current resource metrics and incoming MIS complexity profile.
    Ensures L3 simulation phase utilizes optimal, cost-efficient resources.
    """

    # --- CONFIGURATION DEFAULTS ---
    DSP_C_PATH = 'contracts/DSP-C.json'
    MIN_RESOLUTION_FACTOR = 0.15 # Minimum allowed scaling factor to prevent simulation collapse

    def __init__(self, resource_monitor: Any, dsp_c_path: str = None):
        """
        Initializes the optimizer. Resource Monitor must provide get_average_utilization().
        """
        self.monitor = resource_monitor
        if dsp_c_path:
            self.DSP_C_PATH = dsp_c_path

    def _get_scaling_factor(self, utilization: float) -> float:
        """
        Calculates the dynamic scaling factor based on current system utilization.
        Uses a smooth scaling reduction curve (inverse sigmoid approximation) for granular control.
        """
        if utilization <= 0.70:
            return 1.0 # Full resolution below nominal load
        
        # Scaling reduction logic: Higher excess load leads to a steeper decrease in resolution.
        excess_load = max(0, utilization - 0.70)
        # Exponential Decay Approximation (e.g., 0.8 load -> 0.79 factor; 0.9 load -> 0.6 factor)
        reduction = (excess_load ** 2) * 5.0 
        
        scaling_factor = 1.0 - reduction
        
        return max(self.MIN_RESOLUTION_FACTOR, scaling_factor)

    def calculate_scope(self, mis_complexity_index: float) -> Dict[str, Any]:
        """
        Derives optimal simulation resolution/scope parameters (P_sim, T_iter) 
        based on MIS complexity and current system load.
        """
        try:
            # Assumes ResourceMonitor provides rolling average utilization
            current_utilization = self.monitor.get_average_utilization()
        except AttributeError:
            logger.error("Resource Monitor must implement get_average_utilization() for reliability.")
            current_utilization = 1.0 # Default to max load if monitor fails to trigger resource rationing

        resolution_multiplier = self._get_scaling_factor(current_utilization)
        
        logger.info(f"Utilization: {current_utilization:.2f}. Scaling Factor applied: {resolution_multiplier:.2f}")

        # Optimization Base Rates (Standardized parameters for baseline MIS complexity)
        BASE_P_SIM = 1000
        BASE_T_ITER = 5000 
        
        optimized_scope = {
            "P_sim_resolution": BASE_P_SIM * mis_complexity_index * resolution_multiplier,
            "T_iter_limit": BASE_T_ITER * resolution_multiplier
        }
        return optimized_scope

    def update_dsp_c(self, optimized_parameters: Dict[str, Any]) -> bool:
        """
        Writes the dynamically calculated parameters back to DSP-C for L3 consumption.
        Note: Should be wrapped in an atomic file write utility in production to prevent data corruption.
        """
        try:
            with open(self.DSP_C_PATH, 'w') as f:
                json.dump(optimized_parameters, f, indent=4)
            logger.info(f"Successfully updated DSP-C contract at {self.DSP_C_PATH}")
            return True
        except IOError as e:
            logger.critical(f"IO Error writing DSP-C contract: {e}")
            return False
        except Exception as e:
            logger.critical(f"Unexpected error during DSP-C write: {e}")
            return False