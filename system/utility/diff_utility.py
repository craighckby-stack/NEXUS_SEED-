from typing import Any, List, Dict, Union, Set

Differential = List[Dict[str, Any]]
State = Dict[str, Any]
JsonValue = Union[Dict, List, str, int, float, bool, None]

class DiffUtility:
    """
    Utility class responsible for calculating highly efficient state differentials (JSON Patches)
    via recursive abstraction (Depth First Search).
    """

    # Optimized lookup set for primitive types
    _PRIMITIVES: Set[type] = {str, int, float, bool, type(None)}

    @staticmethod
    def _is_primitive(obj: Any) -> bool:
        """Optimized type check."""
        return type(obj) in DiffUtility._PRIMITIVES

    @staticmethod
    def _recurse_diff(old_data: JsonValue, new_data: JsonValue, path: str, reversible: bool) -> Differential:
        """
        Core recursive function implementing optimized, minimal JSON Patch generation.
        Handles Dict, List, and primitive type changes.
        """
        patches: Differential = []

        # 1. Early Exit and Identity Check (most efficient comparison)
        if old_data is new_data or old_data == new_data:
            return patches
        
        old_type = type(old_data)
        new_type = type(new_data)
        
        # 2. Type Mismatch or Primitive Value Change -> Replace operation
        if old_type != new_type or DiffUtility._is_primitive(old_data):
            patches.append({"op": "replace", "path": path, "value": new_data})
            return patches

        # 3. Handle Dictionary Recursion (O(N) keys)
        if isinstance(old_data, dict):
            old_keys = set(old_data.keys())
            new_keys = set(new_data.keys())

            # A. Keys Removed
            for key in old_keys - new_keys:
                patch: Dict[str, Any] = {"op": "remove", "path": f"{path}/{key}"}
                if reversible:
                    # For high-integrity rollback, include the old value
                    patch["from_value"] = old_data[key]
                patches.append(patch)

            # B. Keys Added
            for key in new_keys - old_keys:
                patches.append({"op": "add", "path": f"{path}/{key}", "value": new_data[key]})

            # C. Keys Updated (Recurse)
            for key in old_keys.intersection(new_keys):
                sub_path = f"{path}/{key}"
                patches.extend(DiffUtility._recurse_diff(old_data[key], new_data[key], sub_path, reversible))
            
            return patches

        # 4. Handle List Recursion (Index-based minimal diff, avoiding expensive LCS)
        if isinstance(old_data, list):
            len_old = len(old_data)
            len_new = len(new_data)
            min_len = min(len_old, len_new)

            # A. Overlapping Indices (Recurse/Replace)
            for i in range(min_len):
                sub_path = f"{path}/{i}"
                patches.extend(DiffUtility._recurse_diff(old_data[i], new_data[i], sub_path, reversible))

            # B. Items Added (Append using RFC 6902 "-" pointer)
            if len_new > len_old:
                for i in range(len_old, len_new):
                    patches.append({"op": "add", "path": f"{path}/-", "value": new_data[i]})

            # C. Items Removed
            if len_old > len_new:
                # Remove from highest index downwards to prevent index shifting issues during patch generation
                for i in range(len_old - 1, len_new - 1, -1):
                    patch = {"op": "remove", "path": f"{path}/{i}"}
                    if reversible:
                        patch["from_value"] = old_data[i]
                    patches.append(patch)
            
            return patches
            
        # 5. Fallback for unhandled complex objects (Treat as replace)
        patches.append({"op": "replace", "path": path, "value": new_data})
        return patches


    # --- Public API Implementations ---

    @staticmethod
    def calculate_differential(old_state: State, new_state: State) -> Differential:
        """
        Calculates the standard JSON Patch (RFC 6902) using recursive abstraction.
        """
        return DiffUtility._recurse_diff(old_state, new_state, "", reversible=False)


    @staticmethod
    def generate_reversible_differential(old_state: State, new_state: State) -> Differential:
        """
        Calculates a differential optimized for transactional rollback by including 
        'from_value' fields in remove operations.
        """
        return DiffUtility._recurse_diff(old_state, new_state, "", reversible=True)