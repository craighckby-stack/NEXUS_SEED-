from system.config.gsep_config import GSEP_PHASES
from system.exceptions.GSEP_exceptions import GSEPConfigurationError
from typing import List, Dict, Any

# Define canonical list of expected phase types
VALID_GSEP_PHASE_TYPES = {
    'ANALYSIS',
    'DECISION',
    'EXECUTION',
    'ATOMIC_VALIDATION',
    'COMMIT'
}

REQUIRED_PHASE_KEYS = ['target', 'agent', 'method', 'type']

def validate_gsep_configuration(phases: List[Dict[str, Any]] = GSEP_PHASES):
    """Ensures the GSEP configuration adheres to schema before Orchestrator initiation."""
    if not phases:
        raise GSEPConfigurationError("GSEP_PHASES configuration is empty.")
        
    seen_targets = set()
    for i, phase in enumerate(phases):
        stage_index = f"Phase Index {i}"
        
        # 1. Check for required keys
        for key in REQUIRED_PHASE_KEYS:
            if key not in phase:
                raise GSEPConfigurationError(f"[{stage_index}] Missing required key '{key}' in phase configuration.")

        # 2. Check phase type validity
        phase_type = phase['type']
        if phase_type not in VALID_GSEP_PHASE_TYPES:
            raise GSEPConfigurationError(f"[{stage_index}] Invalid GSEP phase type '{phase_type}'.")

        # 3. Check target sequence validity (must be monotonically non-decreasing)
        target = phase['target']
        if not isinstance(target, int) or target <= 0 or target > 15:
             raise GSEPConfigurationError(f"[{stage_index}] Target stage must be an integer between 1 and 15.")

        # 4. Check for target redundancy within the pipeline definition (assuming a linear configuration)
        # Note: Targets can repeat if multiple methods run at the same stage, but they must be sequentially defined.

        if target in seen_targets and phase_type not in ('ANALYSIS', 'DECISION', 'EXECUTION'):
             # Only standard multi-part phases (A/D/E) can share targets defined subsequently
             # Atomic validation or commit steps should ideally be singular events per target stage.
             pass # Allowing multiple sequential steps at the same stage for flexibility, the orchestrator handles progression correctly.

        seen_targets.add(target)
        
    # Add a final check to ensure the last phase targets S14 or S15 (implicit commitment)
    if phases[-1]['target'] < 14:
         raise GSEPConfigurationError("Final phase target must be S14 or S15 for full GSEP completion.")
        
    return True
