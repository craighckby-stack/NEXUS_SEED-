import json
from typing import Any, Dict

def canonicalize_json(data: Dict[str, Any]) -> bytes:
    """Generates a deterministic, canonical representation of a JSON object (JCS compliant logic).

    This function ensures data integrity for signing and hashing by enforcing:
    1. Consistent key ordering (alphabetical, mandatory for JCS).
    2. Minimal white-space (separators=(',', ':')).
    3. Consistent Unicode encoding (UTF-8, non-ASCII characters preserved).

    Args:
        data: The dictionary representation of the payload.

    Returns:
        Bytes object containing the canonicalized UTF-8 JSON string.
    
    Raises:
        ValueError: If input data contains non-JSON serializable types.
    """
    try:
        # Configuration matches standard JCS implementation using Python stdlib:
        # sort_keys=True: Alphabetical key ordering.
        # separators=(',', ':'): Removes unnecessary whitespace.
        # ensure_ascii=False: Allows direct UTF-8 encoding of non-ASCII characters.
        canonical_string = json.dumps(
            data,
            sort_keys=True,
            separators=(',', ':'),
            ensure_ascii=False
        )
    except TypeError as e:
        # Catch non-serializable objects (e.g., sets, datetime objects not manually serialized)
        raise ValueError(f"Input data contains non-JSON serializable types: {e}")

    # JCS requires the output to be UTF-8 encoded bytes.
    return canonical_string.encode('utf-8')

if __name__ == '__main__':
    # Example usage
    test_payload = {
        "timestamp": "2024-10-27T12:00:00Z",
        "payload_hashes": {"CFTM_hash": "...", "PVLM_hash": "..."},
        "mandate_id": "AGI-APM-20241027-001"
    }
    canonical = canonicalize_json(test_payload)
    print(f"Original: {json.dumps(test_payload)}")
    print(f"Canonical: {canonical.decode('utf-8')}")
