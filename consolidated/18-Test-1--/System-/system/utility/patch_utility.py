# system/utility/patch_utility.py: AGI State Patch Application Utility

from typing import Any, List, Dict
from jsonpatch import apply_patch, JsonPatchException

# Type aliases reflecting the state management layer structure
StateDelta = List[Dict[str, Any]]  # RFC 6902 JSON Patch structure (the differential)
StateStructure = Dict[str, Any]    # The target state (O_s or N_s)

class StatePatcher:
    """
    Core utility for applying JSON Patch differentials (RFC 6902) to AGI state structures.
    This component ensures atomic and high-integrity state transitions based on calculated deltas.
    
    Relies on the 'jsonpatch' library for efficient, standard-compliant application.
    """

    @staticmethod
    def apply_differential(state: StateStructure, differential: StateDelta) -> StateStructure:
        """
        Applies a calculated JSON Patch (Delta) to a given immutable state structure.
        
        Args:
            state: The base state dictionary (O_s).
            differential: The JSON Patch list (Delta Psi).
            
        Returns:
            The newly derived state dictionary (N_s).
        
        Raises:
            RuntimeError: If the patch application fails due to structural conflict or type error.
        """
        if not differential:
            return state # Optimization: If the delta is empty, return the original state reference.
            
        try:
            # Note: apply_patch performs a deep copy internally when in_place=False, ensuring immutability.
            return apply_patch(state, differential, in_place=False)
        
        except JsonPatchException as e:
            # High-fidelity error handling is crucial for state recovery and debugging.
            raise RuntimeError(
                f"CRITICAL STATE ERROR [Patch Validation/Integrity Failure]: "
                f"Failed to apply differential patch. Details: {e}. State integrity potentially compromised."
            )
        except Exception as e:
            # Catch unexpected issues (e.g., serialization/typing errors)
            raise RuntimeError(
                f"CRITICAL STATE ERROR [Unhandled Exception during Patch]: "
                f"An unknown error occurred during patch application: {e}"
            )

    @staticmethod
    def calculate_inverse_patch(differential: StateDelta) -> StateDelta:
        """
        Calculates the necessary inverse patch to logically revert the effects 
        of the original differential. 

        WARNING: Standard RFC 6902 patches are generally not self-reversible ('remove' loses context).
        A robust rollback system requires a dedicated DiffUtility that captures the pre-mutation context.
        """
        raise NotImplementedError(
            "Inverse patch calculation is an architectural dependency. Implement in an associated 'StateDiffUtility' "
            "that captures the pre-mutation context required for safe reversal."
        )
