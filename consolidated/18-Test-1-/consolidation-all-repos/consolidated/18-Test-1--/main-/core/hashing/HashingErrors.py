class HashingServiceError(Exception):
    """Base exception for all hashing service errors.
    
    Attributes:
        details (dict): Contextual information about the error.
    """
    def __init__(self, message="A hashing service error occurred.", details=None):
        super().__init__(message)
        self.details = details or {}

class HashingInitializationError(HashingServiceError):
    """Raised when the specified hashing algorithm is unavailable or improperly configured.

    Attributes:
        algorithm (str): The name of the algorithm that failed initialization.
    """
    def __init__(self, algorithm: str, message=None):
        base_msg = f"Failed to initialize hashing algorithm '{algorithm}'."
        if message:
            base_msg = f"{base_msg} Details: {message}"
        
        super().__init__(base_msg, details={"algorithm": algorithm})
        self.algorithm = algorithm

class ArtifactSerializationError(HashingServiceError):
    """Raised when an artifact cannot be canonically serialized 
    (e.g., due to unsupported data types, cyclic references, or non-deterministic ordering).
    """
    def __init__(self, data_type=None, reason=None, message=None):
        details = {}
        base_msg = "Artifact cannot be canonically serialized."
        
        if data_type:
            details['data_type'] = str(data_type)
            base_msg += f" Encountered type: {data_type}."
        if reason:
            details['reason'] = reason
            base_msg += f" Reason: {reason}"

        final_msg = message if message else base_msg
        super().__init__(final_msg, details=details)
