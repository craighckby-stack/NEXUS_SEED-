import json
import datetime
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ViolationLogger")

class ViolationLogger:
    """
    Handles structured logging and archival of GICM violations.
    This component separates I/O and persistence logic from validation logic, 
    ensuring auditable records are generated for every enforcement trigger.
    Logs in JSON Lines format for easy downstream processing.
    """
    
    def __init__(self, log_path: str = "logs/gicm_violations.jsonl"):
        self.log_path = log_path
        logger.info(f"Initialized GICM Violation Logger to path: {log_path}")

    def log_violations(self, entity_name: str, record_id: str, violations: List[Dict[str, Any]]):
        """Records the structured violations to the log path."""
        if not violations:
            return

        timestamp = datetime.datetime.utcnow().isoformat()
        
        log_entry = {
            "timestamp_utc": timestamp,
            "entity": entity_name,
            "record_id": record_id, # Identifier of the record that failed validation (e.g., UUID)
            "violation_count": len(violations),
            "severity_level": self._determine_severity(violations),
            "violations": violations
        }
        
        try:
            with open(self.log_path, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except IOError as e:
            logger.error(f"Failed to write violation log entry for {entity_name}: {e}")

    def _determine_severity(self, violations: List[Dict[str, Any]]) -> str:
        """Determines the overall severity based on violation codes."""
        codes = [v['code'] for v in violations]
        
        # Specific checks for critical governance failures
        if any('GICM_L5' in code or 'INTEGRITY_COMPROMISED' in code for code in codes):
            return "CRITICAL"
        if any('MISSING_REQUIRED' in code or 'CONSTRAINT_VIOLATION' in code for code in codes):
            return "HIGH"
        return "LOW"