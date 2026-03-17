import json
import logging
import time
from collections import deque
from typing import Dict, Any, Deque, TypedDict, Literal

# --- Configuration: Data Schemas (Ideally imported from policy_interface_schema) ---

class STRResult(TypedDict):
    """Schema for processed State Transition Receipt results."""
    success: bool
    adtm_failed: bool

class GovernanceProposal(TypedDict):
    """Standardized schema for adaptive governance tuning proposals (ADAPTIVE_TUNING_P1)."""
    GOVERNANCE_PROTOCOL: Literal["ADAPTIVE_TUNING_P1"]
    TARGET_POLICY_METRIC: str
    DIRECTION: Literal["INCREASE", "DECREASE"]
    CHANGE_VALUE: float
    CURRENT_MONITOR_RATE: float
    RATIONALE: str
    SOURCE_DAEMON: str
    TIMESTAMP: float
    VERSION_EPOCH: str

# --- Configuration: Daemon Parameters ---
class OLDConfig:
    """Centralized configuration for the Oversight Learning Daemon (OLD)."""
    # History & Analysis Window
    MAX_HISTORY_LENGTH = 120 # Increased window size for better statistical significance
    MIN_ANALYSIS_WINDOW = 60 # Requires 60 data points before active analysis
    
    # Adaptive Threshold Management (ADTM) Thresholds
    ADTM_DEBT_THRESHOLD = 0.10      # High Failure Rate -> Decrease policy threshold (Debt Relief)
    ADTM_STABILITY_FLOOR = 0.02     # Low Failure Rate -> Cautiously Increase threshold (Optimization Pressure)

    # Adjustment Parameters
    ADJUSTMENT_STEP = 0.005 # Magnitude of policy change
    TARGET_POLICY_KEY = "ACVD_TEMM_REQUIREMENT" # The metric being tuned
    POLICY_INTERFACE_TARGET = 'GOV_PCS_ADAPTIVE_CHANNEL' # Abstract target ID for Policy Control Server
    SOURCE_DAEMON_ID = "GOV_OLD_V94.1.R1" 

# --- Dependency Management ---
# Governance Transmitter must be robustly handled.
TRANSMITTER_AVAILABLE = False
try:
    from system.governance.governance_transmitter import transmit_governance_proposal
    TRANSMITTER_AVAILABLE = True
except ImportError:
    def transmit_governance_proposal(proposal: GovernanceProposal, target: str) -> bool:
        logging.critical("Governance Transmitter missing. Proposal logged locally/dropped.")
        print(json.dumps(proposal, indent=2))
        return False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - OLD_Daemon - %(levelname)s - %(message)s')
DAEMON_LOGGER = logging.getLogger('OLD_Daemon')
DAEMON_LOGGER.setLevel(logging.INFO)

class OversightLearningDaemon:
    """
    OLD Daemon: Monitors STR outcomes (Adaptive Threshold Management) and adaptively 
    adjusts core cognitive utility policy thresholds based on rolling window performance.
    """

    def __init__(self):
        self.recent_str_results: Deque[STRResult] = deque(maxlen=OLDConfig.MAX_HISTORY_LENGTH)
        self.current_adtm_failure_rate: float = 0.0
        DAEMON_LOGGER.info(f"Initialized OLD Daemon. History size: {OLDConfig.MAX_HISTORY_LENGTH}.")
        if not TRANSMITTER_AVAILABLE:
             DAEMON_LOGGER.critical("Governance transmission path is not functional.")


    def ingest_str(self, str_data: Dict[str, Any]):
        """Ingests raw State Transition Receipt data and updates the performance buffer."""
        
        p01_pass = str_data.get('P_01_PASS', True)
        failure_flags = str_data.get('FAILURE_FLAGS', {}) # Use .get for safety
        
        result: STRResult = {
            'success': p01_pass,
            'adtm_failed': 'ADTM' in failure_flags
        }
        
        self.recent_str_results.append(result)
        self._check_for_intervention()

    def _calculate_adtm_metrics(self) -> tuple[int, int, float]:
        """Calculates total attempts, ADTM failures, and the ADTM failure rate."""
        total_attempts = len(self.recent_str_results)
        
        if total_attempts == 0:
            return 0, 0, 0.0
            
        # Efficient calculation across the deque
        adtm_failures = sum(1 for result in self.recent_str_results if result['adtm_failed'])
        current_rate = adtm_failures / total_attempts
        return total_attempts, adtm_failures, current_rate

    def _check_for_intervention(self):
        """Analyzes metrics against configuration thresholds and proposes governance action if warranted."""
        
        total, _, rate = self._calculate_adtm_metrics()
        self.current_adtm_failure_rate = rate

        if total < OLDConfig.MIN_ANALYSIS_WINDOW: 
            return # Awaiting sufficient confidence window

        # 1. Critical Debt Management (High failure rate)
        if rate > OLDConfig.ADTM_DEBT_THRESHOLD:
            DAEMON_LOGGER.warning(
                f"INTERVENTION: High ADTM rate ({rate:.3f} > {OLDConfig.ADTM_DEBT_THRESHOLD}). Proposing Policy DECREASE."
            )
            self._propose_adjustment(
                direction='DECREASE',
                rationale=f"Sustained ADTM denial rate ({rate:.3f}) exceeds critical debt threshold. Releasing cognitive utility vetting pressure."
            )
            
        # 2. Optimization Pressure Application (Stable/Low failure rate)
        elif rate < OLDConfig.ADTM_STABILITY_FLOOR and total == OLDConfig.MAX_HISTORY_LENGTH:
            DAEMON_LOGGER.info(
                f"INTERVENTION: Low ADTM rate ({rate:.3f} < {OLDConfig.ADTM_STABILITY_FLOOR}). Proposing Policy INCREASE."
            )
            self._propose_adjustment(
                direction='INCREASE',
                rationale=f"Sustained ADTM failure rate ({rate:.3f}) is below stability floor. Incrementally raising cognitive utility requirement for optimization."
            )

    def _propose_adjustment(self, direction: Literal['INCREASE', 'DECREASE'], rationale: str):
        """Generates and transmits the governance adjustment proposal payload."""
        
        adjustment_value = OLDConfig.ADJUSTMENT_STEP if direction == 'INCREASE' else -OLDConfig.ADJUSTMENT_STEP 
        
        proposal: GovernanceProposal = {
            "GOVERNANCE_PROTOCOL": "ADAPTIVE_TUNING_P1",
            "TARGET_POLICY_METRIC": OLDConfig.TARGET_POLICY_KEY,
            "DIRECTION": direction,
            "CHANGE_VALUE": adjustment_value, 
            "CURRENT_MONITOR_RATE": self.current_adtm_failure_rate,
            "RATIONALE": rationale,
            "SOURCE_DAEMON": OLDConfig.SOURCE_DAEMON_ID,
            "TIMESTAMP": time.time(),
            "VERSION_EPOCH": "V94.1.ADAPTIVE_GOV_R1"
        }

        if TRANSMITTER_AVAILABLE:
            transmit_governance_proposal(proposal, OLDConfig.POLICY_INTERFACE_TARGET)

# --- Execution Simulation ---
if __name__ == '__main__':
    DAEMON_LOGGER.setLevel(logging.DEBUG)
    daemon = OversightLearningDaemon()
    
    # Phase 1: Warm Up (60 STRs)
    print("\n--- SIMULATION PHASE 1: WARM UP (60 STRs) ---")
    for _ in range(60):
        daemon.ingest_str({'P_01_PASS': True, 'FAILURE_FLAGS': {}})
    
    # Phase 2: Simulate High Failure Rate (Window 60 to 120. Triggers DECREASE)
    print("\n--- SIMULATION PHASE 2: HIGH ADTM RATE (Trigger DECREASE) ---")
    for i in range(60):
        is_failure = (i % 5 == 0) # 20% failure rate
        flags = {'ADTM': 'UtilityDebt'} if is_failure else {}
        daemon.ingest_str({'P_01_PASS': not is_failure, 'FAILURE_FLAGS': flags})

    # Phase 3: Simulate Stability (120 steps) -> Triggers INCREASE proposal after queue stabilization
    print("\n--- SIMULATION PHASE 3: LOW ADTM RATE (Trigger INCREASE) ---")
    for i in range(120):
        daemon.ingest_str({'P_01_PASS': True, 'FAILURE_FLAGS': {}})

    print(f"\nDaemon simulation finished. Final Rate: {daemon.current_adtm_failure_rate:.3f}")