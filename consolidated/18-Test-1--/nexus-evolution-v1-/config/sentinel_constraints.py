# config/sentinel_constraints.py: Defines rigid type and value constraints for IH_Sentinel enforcement.

from typing import Dict, Any, Union

SENTINEL_TEDS_CONSTRAINTS: Dict[str, Dict[str, Any]] = {
    # Defines field-level validation rules for TEDS payload fields
    "integrity_score": {
        "type": "float",
        "range": [0.0, 1.0],
        "critical_deviation_max": 0.1
    },
    "stage": {
        "type": "str",
        "allowed_values": ["CALCULUS_START", "RECONCILIATION", "GOVERNANCE_CHECK"]
    }
}

AXIOMATIC_CONSTRAINTS: Dict[str, Any] = {
    # System-level hard constraints relevant to triggering IH
    "MAX_IH_ATTEMPTS_PER_CYCLE": 3,
    "CRITICAL_SYSTEM_MEMORY_THRESHOLD_GB": 0.5
}
