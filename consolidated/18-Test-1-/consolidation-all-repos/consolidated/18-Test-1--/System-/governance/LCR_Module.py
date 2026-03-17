# L4 Constraint Resolver Module (LCR)

import json

# Path defined in GCM V94.1
GTCM_PATH = "/governance/GTCM_V94.1.json"

def load_gtcm(path=GTCM_PATH):
    """Loads and parses the Governance Threshold Contract Manifest."""
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        raise IOError("GTCM configuration not found. L4 commitment aborted.")

def resolve_l4_binding(efficacy_s01: float, risk_s02: float) -> bool:
    """Applies GTCM constraints against S-01 and S-02 metrics."""
    gtcm = load_gtcm()
    
    # Constraints defined in GTCM V94.1 structure
    UTILITY_MIN = gtcm.get('thresholds', {}).get('utility_min', 0.0)
    EXPOSURE_MAX = gtcm.get('thresholds', {}).get('exposure_max', float('inf'))

    # L4 Constraint Binding Logic
    utility_check = efficacy_s01 > UTILITY_MIN
    exposure_check = risk_s02 < EXPOSURE_MAX

    # Mandatory condition for GSEP L4 PASS
    return utility_check and exposure_check

# NOTE: This module is executed *before* L5 P-01 Finality. 
# Failure at L4 triggers immediate GFRM escalation.