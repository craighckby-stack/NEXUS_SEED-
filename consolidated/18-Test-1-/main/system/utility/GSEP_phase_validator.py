from typing import List, Dict, Any
from system.exceptions.GSEP_exceptions import GSEPConfigurationError

# Define known phase types for strict validation
KNOWN_PHASE_TYPES = {
    "EXECUTION", 
    "PREP_CHECK", 
    "ATOMIC_VALIDATION", 
    "COMMIT_ANCHOR"
}

def validate_gsep_config(phases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ensures the list of GSEP phases adheres to structural, sequential, 
    and type constraints before execution begins.
    
    This utility formalizes the checks performed preliminarily by the Orchestrator, 
    providing a clear separation of configuration management and runtime execution.
    """
    required_keys = ['target', 'agent', 'method', 'type']
    last_target = 0

    if not isinstance(phases, list):
        raise GSEPConfigurationError("GSEP configuration must be a list of phases.")

    for i, phase in enumerate(phases):
        phase_label = f"Phase Index {i}"
        
        # 1. Structural Check
        if not all(key in phase for key in required_keys):
            missing = [key for key in required_keys if key not in phase]
            raise GSEPConfigurationError(f"{phase_label}: Missing required keys: {missing}")

        # 2. Target Sequential Check (Ensures linearity)
        target = phase['target']
        if not isinstance(target, int) or target <= last_target:
            raise GSEPConfigurationError(f"{phase_label}: Target stage '{target}' is not sequentially increasing or is not an integer. Must be > {last_target}.")
        last_target = target

        # 3. Type Check (Ensures adherence to GSEP standards)
        phase_type = phase['type']
        if phase_type not in KNOWN_PHASE_TYPES:
             raise GSEPConfigurationError(f"{phase_label}: Unknown phase type: '{phase_type}'. Known types are {list(KNOWN_PHASE_TYPES)}")

    return phases