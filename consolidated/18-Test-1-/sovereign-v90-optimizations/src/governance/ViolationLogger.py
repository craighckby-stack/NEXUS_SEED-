import json
import datetime
from typing import List, Dict, Any
import logging
import threading
import os

# Configure logging scope locally (assuming global config is absent)
logger = logging.getLogger("ViolationLogger")

# NOTE: This internal map is a placeholder. Architecturally, this should be loaded 
# from an external configuration file (see 'scaffold' proposal below).
SEVERITY_MAPPING = {
    "CRITICAL": ["GICM_L5", "INTEGRITY_COMPROMISED", "SECURITY_BREACH"],
    "HIGH": ["MISSING_REQUIRED", "CONSTRAINT_VIOLATION", "POLICY_INFRACTION"],
}

class ViolationLogger:
    """
    Handles structured logging and archival of GICM violations using thread-safe 
    JSON Lines persistence. Separates I/O and ensures auditable, standardized records.
    """
    
    def __init__(self, log_path: str = "logs/gicm_violations.jsonl"):
        # Ensure the log directory exists before initializing
        os.makedirs(os.path.dirname(log_path) or '.', exist_ok=True)
        self.log_path = log_path
        self._write_lock = threading.Lock() # Ensures thread-safe write operations
        logger.info(f"Initialized GICM Violation Logger (Thread-Safe) to path: {log_path}")

    def log_violations(self, entity_name: str, record_id: str, violations: List[Dict[str, Any]]):
        """Records the structured violations to the log path in a protected, JSON Lines format."""
        if not violations:
            logger.debug(f"No violations reported for {entity_name}:{record_id}. Skipping logging.")
            return

        # Use timezone-aware datetime (UTC) for maximum auditability
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        log_entry = {
            "timestamp_utc": timestamp,
            "entity": entity_name,
            "record_id": record_id,
            "violation_count": len(violations),
            "severity_level": self._determine_severity(violations),
            "violations": violations
        }
        
        try:
            # Use a lock to ensure only one thread writes at a time
            with self._write_lock:
                with open(self.log_path, 'a', encoding='utf-8') as f:
                    # Ensure non-ASCII characters are handled correctly in the JSON dump
                    f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
        except Exception as e:
            # Catching general exception for robust error handling (e.g., permissions, disk full)
            logger.critical(f"FATAL I/O Error writing violation log for {entity_name}:{record_id}. Error: {e}", exc_info=True)

    def _determine_severity(self, violations: List[Dict[str, Any]]) -> str:
        """Determines the overall severity based on configured violation codes."""
        
        # Extract all unique violation codes defensively
        codes = {v.get('code', 'UNKNOWN_CODE') for v in violations}
        
        # Check mapping in order of decreasing severity
        for level, triggers in SEVERITY_MAPPING.items():
            if any(trigger in code for trigger in triggers for code in codes):
                return level
        
        # Default fallback for informational or non-critical issues
        return "LOW"