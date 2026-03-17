import json
import typing
from .HashingErrors import ArtifactSerializationError

def serialize_for_hashing(artifact: typing.Any) -> bytes:
    """Converts an arbitrary Python object into a canonical byte string for hashing.

    Canonical serialization ensures that the byte output is consistent across different
    execution environments, specifically by enforcing sorted dictionary keys.

    Args:
        artifact: The data structure (typically a dictionary or list) to serialize.

    Returns:
        bytes: The deterministic byte representation.

    Raises:
        ArtifactSerializationError: If the data structure contains non-serializable types
            (e.g., functions, custom objects without proper serialization methods, cycles).
    """
    try:
        # Ensure consistent order by using `sort_keys=True` and no indentation.
        serialized_string = json.dumps(artifact, sort_keys=True, separators=(',', ':'))
        return serialized_string.encode('utf-8')
    except TypeError as e:
        # Attempt to capture the offending type if possible (often complex in JSON)
        offending_type = getattr(e, 'args', [''])[0]
        raise ArtifactSerializationError(reason=str(e), data_type=offending_type) from e
    except Exception as e:
        raise ArtifactSerializationError(reason=str(e)) from e


# Helper function example for a specific data type if needed:
# def canonicalize_dict(d: dict) -> dict:
#     return dict(sorted(d.items()))
