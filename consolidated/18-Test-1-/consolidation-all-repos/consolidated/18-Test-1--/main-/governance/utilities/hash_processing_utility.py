import copy
from typing import Dict, List, Any

# Import configuration constants
from governance.config.hash_exclusion_config import HASH_EXCLUSION_CONFIG

class HashProcessingUtility:
    """
    Manages operations related to stable cryptographic hashing, primarily by filtering 
    transient fields based on predefined governance configuration.
    
    Ensures stable canonicalization for cryptographic hashing, even when transient data is present.
    """

    @staticmethod
    def _get_exclusions(payload_type: str) -> List[str]:
        """Retrieves the list of canonicalization exclusions for a given payload type.
        Used internally to query HASH_EXCLUSION_CONFIG.
        """
        return HASH_EXCLUSION_CONFIG.get(payload_type, [])

    @staticmethod
    def _delete_path(data: Dict[str, Any], path: str):
        """Internal helper to traverse a dictionary using dot notation and delete a nested key.
        Handles gracefully if the path does not exist.
        """
        keys = path.split('.')
        current = data
        
        # Traverse up to the parent dictionary
        for i in range(len(keys) - 1):
            key = keys[i]
            if not isinstance(current, dict) or key not in current:
                return  # Path does not exist
            current = current[key]
        
        # Target deletion
        target_key = keys[-1]
        if isinstance(current, dict) and target_key in current:
            del current[target_key]

    @staticmethod
    def apply_exclusions(data: Dict[str, Any], payload_type: str) -> Dict[str, Any]:
        """
        Applies governance-defined exclusion rules.
        
        Deep copies the input data and removes fields specified for exclusion 
        in HASH_EXCLUSION_CONFIG for the given payload_type.
        """
        if not data:
            return {}
            
        # Always operate on a deep copy to preserve the original payload state.
        cleaned_data = copy.deepcopy(data)
        
        exclusions = HashProcessingUtility._get_exclusions(payload_type)
        
        for path in exclusions:
            HashProcessingUtility._delete_path(cleaned_data, path)
            
        return cleaned_data