from typing import Any, Optional, Dict
import time
import logging

logger = logging.getLogger(__name__)

class TrustEventLogger:
    """
    Records immutable events that lead to adjustments in SourceTrustHistoryLedger scores.
    This provides the forensic audit trail necessary for trust calibration and verification.
    """
    def __init__(self, persistence_client: Optional[Any] = None):
        # persistence_client must support append-only logging (e.g., Kafka, specialized DB table, S3 log file)
        self.persistence = persistence_client

    def record_event(self, 
                     source_id: str, 
                     event_type: str, 
                     adjustment_magnitude: float, 
                     context: Dict[str, Any] = None):
        """
        Logs a specific trust-affecting event.
        
        :param source_id: ID of the telemetry provider.
        :param event_type: Classification of the event (e.g., 'INTEGRITY_FAIL', 'CONSENSUS_PASS', 'LATENCY_PENALTY').
        :param adjustment_magnitude: The change applied to the score (can be positive or negative).
        :param context: Detailed metrics related to the event (e.g., divergence metric, latency in ms).
        """
        event_record = {
            'timestamp': time.time(),
            'source_id': source_id,
            'event_type': event_type,
            'adjustment': adjustment_magnitude,
            'context': context if context is not None else {},
        }

        if self.persistence:
            try:
                # Placeholder for writing to the immutable log store
                # Example: self.persistence.append_record('trust_events', event_record)
                logger.debug(f"Logged trust event {event_type} for {source_id}: {adjustment_magnitude}")
            except Exception as e:
                logger.error(f"Failed to write trust event to persistence for {source_id}: {e}")
        else:
             # If persistence is absent, just log locally
            logger.info(f"[NON-PERSISTED TRUST LOG] {event_record}")
