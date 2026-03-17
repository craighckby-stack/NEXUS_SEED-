from typing import Dict, Any, Optional
import time
import logging

logger = logging.getLogger(__name__)

# --- Configuration Constants for Trust Model ---
class TrustConstants:
    """Centralized constants for STHL adjustments and operation.
    These should typically be loaded from a configuration service or file.
    """
    DECAY_TIME_UNIT_SECONDS = 3600.0  # Time unit for decay calculation (e.g., per hour)
    DEFAULT_INITIAL_SCORE = 0.5
    MINIMUM_SCORE_FLOOR = 0.1
    MAXIMUM_SCORE_CEILING = 1.0

    # Adjustment Magnitudes
    PENALTY_INTEGRITY_FAILURE = 0.20
    PENALTY_CONSENSUS_FAILURE = 0.05
    REWARD_BASE_SUCCESS = 0.01

class SourceTrustHistoryLedger:
    """
    STHL: Manages and updates dynamic trust scores for all known telemetry providers.
    Scores (0.0 to 1.0) are adjusted based on historical performance, divergence from consensus,
    integrity failures, and latency. TCRM uses these scores to apply dynamic weighting.
    """
    
    def __init__(self, persistence_layer: Optional[Any] = None, decay_rate: float = 0.99):
        # persistence_layer must handle state saving/loading (e.g., database, key-value store)
        self.persistence = persistence_layer
        self.decay_rate = decay_rate
        # Cache structure: {'score': float, 'last_update': float}
        self.trust_cache: Dict[str, Dict[str, float]] = {}
        self._load_state()

    def _load_state(self):
        """Placeholder to load all known scores from the persistence layer on initialization."""
        if self.persistence:
            # Implementation required: load self.trust_cache = self.persistence.load_all_scores()
            pass

    def _save_state(self, source_id: str):
        """Placeholder to save the current score and timestamp for a specific source to persistence."""
        if self.persistence:
            # Implementation required: self.persistence.save_score(source_id, self.trust_cache[source_id])
            pass
            
    def _calculate_decayed_score(self, data: Dict[str, float]) -> float:
        """Calculates the score after applying temporal decay since the last update."""
        
        elapsed = time.time() - data['last_update']
        
        # Calculate decay factor relative to the defined time unit (e.g., hourly decay)
        decay_periods = elapsed / TrustConstants.DECAY_TIME_UNIT_SECONDS
        decay_factor = self.decay_rate ** decay_periods
        
        current_score = data['score'] * decay_factor
        
        # Apply score floor
        return max(current_score, TrustConstants.MINIMUM_SCORE_FLOOR)

    def _set_score(self, source_id: str, new_score: float, reason: str):
        """
        Private method to safely update and persist a source's score, enforcing bounds.
        """
        # Ensure bounds are respected
        final_score = max(TrustConstants.MINIMUM_SCORE_FLOOR, 
                          min(TrustConstants.MAXIMUM_SCORE_CEILING, new_score))
        
        # Get score *before* update (for logging reference)
        current_score = self.get_current_trust_score(source_id)
        
        self.trust_cache[source_id] = {
            'score': final_score, 
            'last_update': time.time()
        }
        
        self._save_state(source_id) # Persist the new state
        logger.debug(f"STHL updated score for {source_id} (Reason: {reason}): {current_score:.4f} -> {final_score:.4f}")

    def get_current_trust_score(self, source_id: str) -> float:
        """
        Retrieves the current normalized trust score, calculated after applying temporal decay.
        """
        if source_id not in self.trust_cache:
            # Initialize state 
            self.trust_cache[source_id] = {
                'score': TrustConstants.DEFAULT_INITIAL_SCORE, 
                'last_update': time.time()
            }
            # For new sources, return the initial score immediately (no decay yet)
            return TrustConstants.DEFAULT_INITIAL_SCORE
        
        data = self.trust_cache[source_id]
        
        # Calculate the decayed score based on elapsed time.
        return self._calculate_decayed_score(data)

    def update_score_on_reconciliation(self, source_id: str, success: bool, divergence_metric: float):
        """
        Adjusts the score based on the outcome of a TCRM reconciliation cycle.
        The adjustment is applied to the currently decayed score.
        """
        current_score = self.get_current_trust_score(source_id)
        adjustment = 0.0
        reason = "Consensus"
        
        if success:
            # Positive adjustment scaled inversely by divergence metric.
            # divergence_metric * 10 assumes metrics above 0.1 largely negate rewards.
            divergence_factor = min(1.0, divergence_metric * 10) 
            adjustment = TrustConstants.REWARD_BASE_SUCCESS * (1.0 - divergence_factor)
            reason += ": Success"
        else:
            # Penalty for failing during consensus resolution
            adjustment = -TrustConstants.PENALTY_CONSENSUS_FAILURE
            reason += ": Failure"
        
        new_score = current_score + adjustment
        self._set_score(source_id, new_score, reason)

    def record_integrity_failure(self, source_id: str):
        """
        Penalty for failing basic validation (e.g., schema, cryptographic hash check).
        """
        current_score = self.get_current_trust_score(source_id)
        new_score = current_score - TrustConstants.PENALTY_INTEGRITY_FAILURE
        self._set_score(source_id, new_score, "Integrity Failure")
