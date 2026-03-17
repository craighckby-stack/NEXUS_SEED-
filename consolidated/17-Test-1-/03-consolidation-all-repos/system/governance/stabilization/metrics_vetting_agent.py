import time
import logging
from typing import Dict, Any, Deque
from collections import deque, defaultdict
from dataclasses import dataclass, field

# --- Initialization & Dependency Injection ---

# Set up logger first
logging.basicConfig(level=logging.INFO, format='%(asctime)s - MHVA - %(levelname)s - %(message)s')
logger = logging.getLogger('MetricsVettingAgent')

# Stub Governance Transmitter for robustness against missing dependencies
try:
    from system.governance.governance_transmitter import transmit_governance_proposal
except ImportError:
    logger.warning("Governance Transmitter dependency missing. Using internal stub.")
    def transmit_governance_proposal(proposal: Dict[str, Any], target: str) -> bool:
        logger.warning(f"STUB: Proposal destined for {target} not sent. Direction: {proposal.get('DIRECTION')}")
        return False

# --- Data Structures ---

@dataclass
class VettingConfig:
    REQUIRED_PERSISTENCE: int = 3       # N consecutive signals required
    SIGNAL_WINDOW_SECONDS: int = 300    # Signals must arrive within 5 minutes
    MAX_HISTORY: int = 100              # Increased history size for stability analysis (Efficiency handled by time-filtering)

@dataclass
class ProposalSignal:
    direction: str
    timestamp: float
    proposal: Dict[str, Any] = field(default_factory=dict)
    target_endpoint: str = ""


class MetricsVettingAgent:
    """MHVA: Provides a stabilization layer for autonomous governance proposals by requiring 
    temporal smoothing and directional persistence before escalation."""

    def __init__(self, config: VettingConfig = VettingConfig()):
        self.config = config
        # Key: metric_key, Value: Deque of ProposalSignal objects
        self.signal_history: Dict[str, Deque[ProposalSignal]] = defaultdict(
            lambda: deque(maxlen=self.config.MAX_HISTORY)
        )
        self.logger = logger

    def _forward_proposal(self, proposal: Dict[str, Any], target_endpoint: str) -> bool:
        """Forwards the successfully vetted proposal to the Policy Control Server (PCS)."""
        if target_endpoint:
            self.logger.info(
                f"Vetting successful. Forwarding proposal: {proposal.get('TARGET_POLICY_METRIC', 'UNKNOWN')} "
                f"({proposal.get('DIRECTION', 'N/A')})"
            )
            return transmit_governance_proposal(proposal, target_endpoint)
        
        self.logger.error("Vetting successful, but target endpoint missing.")
        return False

    def _get_persistent_signals(self, metric_key: str, signal: ProposalSignal) -> list[ProposalSignal]:
        """Checks history for sufficient temporal and directional persistence."""
        current_time = signal.timestamp
        history = self.signal_history[metric_key]
        
        # Filter for recent signals matching the current direction
        relevant_signals = [
            s for s in history 
            if s.direction == signal.direction and 
               (current_time - s.timestamp) <= self.config.SIGNAL_WINDOW_SECONDS
        ]
        return relevant_signals

    def _clear_successful_signals(self, metric_key: str, successful_signals: list[ProposalSignal]):
        """Resets the persistence counter by clearing all successful signals from history.
        Requires reconstructing the deque, prioritizing remaining older/different signals.
        """
        if not successful_signals:
            return

        # We only remove signals *that were present* in the successful list. 
        # This handles cases where a later signal triggers persistence based on a subset of history.
        success_timestamps = {s.timestamp for s in successful_signals}
        
        remaining_history = [
            s for s in self.signal_history[metric_key] 
            if s.timestamp not in success_timestamps
        ]
        
        # Rebuild the deque
        self.signal_history[metric_key] = deque(remaining_history, maxlen=self.config.MAX_HISTORY)


    def ingest_proposal(self, raw_proposal: Dict[str, Any]):
        """Ingests a raw proposal and applies stabilization vetting."""
        
        metric_key = raw_proposal.get("TARGET_POLICY_METRIC")
        direction = raw_proposal.get("DIRECTION")
        target_endpoint = raw_proposal.get("TARGET_POLICY_SERVER")
        current_time = time.time()
        
        if not all([metric_key, direction, target_endpoint]):
            self.logger.warning(f"Malformed proposal received: {raw_proposal}")
            return
        
        # Create structured signal object
        new_signal = ProposalSignal(
            direction=direction,
            timestamp=current_time,
            proposal=raw_proposal,
            target_endpoint=target_endpoint
        )
        
        # Record the incoming signal
        self.signal_history[metric_key].append(new_signal)
        
        # Check for Persistence
        relevant_signals = self._get_persistent_signals(metric_key, new_signal)
        
        if len(relevant_signals) >= self.config.REQUIRED_PERSISTENCE:
            self.logger.critical(
                f"PERSISTENCE MET: {metric_key} has {len(relevant_signals)} recent '{direction}' signals. Triggering action."
            )
            
            # Use the latest received proposal payload as the action instruction
            latest_proposal = new_signal.proposal
            
            # 1. Forward the proposal
            self._forward_proposal(latest_proposal, target_endpoint)
            
            # 2. Reset stabilization counter
            self._clear_successful_signals(metric_key, relevant_signals)
            
        else:
            self.logger.debug(
                f"Persistence not met for {metric_key} ({len(relevant_signals)}/{self.config.REQUIRED_PERSISTENCE})."
            )

if __name__ == '__main__':
    agent = MetricsVettingAgent()
    logger.info("MHVA operational.")
    # Example usage requires external proposal stream. 
    # Use of __name__ check remains simple, deferring complex simulation outside core logic.
