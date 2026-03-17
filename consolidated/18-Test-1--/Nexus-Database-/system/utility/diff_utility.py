# system/utility/diff_utility.py: State Differential Generation Utility

from typing import Any, List, Dict

Differential = List[Dict[str, Any]]
State = Dict[str, Any]

class DiffUtility:
    """
    Utility class responsible for calculating state differentials (JSON Patches) 
    and ensuring the generation of patches necessary for transactional rollback.
    This component provides the necessary input for StatePatcher.
    """

    @staticmethod
    def calculate_differential(old_state: State, new_state: State) -> Differential:
        """
        Calculates the standard JSON Patch (RFC 6902) required to transform old_state into new_state.
        
        Implementation requires integration with a deep object comparison library 
        (e.g., `jsondiff` or custom AGI state comparison engine).
        """
        raise NotImplementedError("Core state differential calculation implementation required.")


    @staticmethod
    def generate_reversible_differential(old_state: State, new_state: State) -> Differential:
        """
        Calculates a special differential that includes 'from' data where necessary 
        (e.g., in remove operations) to guarantee transactional rollback integrity. 
        
        This complex patch type should be used when state changes are applied across trust boundaries 
        or require high-integrity logging and reversion capabilities.
        """
        raise NotImplementedError("Reversible differential generation required for high-integrity transactions.")

