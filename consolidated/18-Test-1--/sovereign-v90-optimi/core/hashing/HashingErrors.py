from typing import Any, Optional, Dict

class HashingServiceError(Exception):
    """
    Base exception for all errors occurring within the core hashing service 
    or its related components (e.g., serialization, verification).
    
    Attributes:
        details (Dict[str, Any]): Contextual information about the error,
                                   useful for logging and debugging.
    """
    def __init__(self, message: str = "A core hashing service error occurred.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.details = details if details is not None else {}

class UnsupportedAlgorithmError(HashingServiceError):
    """Raised when the specified hashing algorithm is not recognized or available 
    in the current environment (e.g., an invalid hash name is passed).
    """
    def __init__(self, algorithm: str):
        message = f"Unsupported hashing algorithm specified: '{algorithm}'."
        super().__init__(message, details={"algorithm": algorithm})
        self.algorithm = algorithm

class HashingInitializationError(HashingServiceError):
    """
    Raised when a recognized hashing algorithm fails to initialize or configure 
    (e.g., missing required salt, incompatible configuration parameters, or dependency issues).
    """
    def __init__(self, algorithm: str, config_issue: str):
        message = f"Failed to initialize hashing algorithm '{algorithm}'. Reason: {config_issue}"
        super().__init__(message, details={"algorithm": algorithm, "reason": config_issue})
        self.algorithm = algorithm

class ArtifactSerializationError(HashingServiceError):
    """
    Raised when an input artifact cannot be canonically serialized 
    for hashing (e.g., due to unsupported data types, cyclic references, 
    or non-deterministic ordering).
    """
    def __init__(self, obj_type: Optional[Any] = None, reason: Optional[str] = None):
        details = {}
        base_msg = "Artifact cannot be canonically serialized for hashing."
        
        if obj_type:
            # Try to get a helpful representation of the type
            type_str = str(type(obj_type)) if not isinstance(obj_type, str) else obj_type
            details['object_type'] = type_str
            base_msg += f" Encountered type: {type_str}."
        if reason:
            details['reason'] = reason
            base_msg += f" Details: {reason}"

        super().__init__(base_msg, details=details)

class HashVerificationError(HashingServiceError):
    """
    Raised when a calculated hash does not match the expected hash, indicating 
    a data integrity or tampering issue.
    """
    def __init__(self, expected_hash: str, calculated_hash: str, artifact_identifier: Optional[str] = None):
        details = {
            "expected_hash": expected_hash[:16] + "..." if len(expected_hash) > 20 else expected_hash,
            "calculated_hash": calculated_hash[:16] + "..." if len(calculated_hash) > 20 else calculated_hash,
        }
        if artifact_identifier:
            details["artifact_id"] = artifact_identifier
        
        message = f"Hash verification failed for artifact '{artifact_identifier if artifact_identifier else 'N/A'}'. Mismatch detected."
        
        super().__init__(message, details=details)