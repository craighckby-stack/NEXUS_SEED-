import numpy as np
import base64
import hashlib
import json

def generate_vec_payload(np_array: np.ndarray, vec_id: str, format_type: str = "BASE64_BINARY", metadata: dict = None):
    """
    Creates a VEC/P01 compliant VectorPayload from a NumPy array, prioritizing binary encoding.
    """
    
    # 1. Determine Encoding
    dtype_map = {
        np.float32: "float32",
        np.float64: "float64",
        np.int8: "int8",
        np.uint8: "uint8"
    }
    encoding = dtype_map.get(np_array.dtype.type)
    if not encoding:
        raise ValueError(f"Unsupported dtype: {np_array.dtype}")

    checksum = None
    if format_type == "BASE64_BINARY":
        # Serialize to bytes (raw buffer) and calculate checksum
        raw_bytes = np_array.tobytes()
        checksum = hashlib.sha256(raw_bytes).hexdigest()
        encoded_data = base64.b64encode(raw_bytes).decode('utf-8')
        vector_data = encoded_data
    
    elif format_type == "JSON_ARRAY":
        vector_data = np_array.tolist()
    else:
        raise ValueError("Invalid format_type")

    payload = {
        "id": vec_id,
        "data": vector_data,
        "dimensions": np_array.shape[0],
        "encoding": encoding,
        "format": format_type,
        "vector_checksum": checksum,
        "metadata": metadata or {}
    }
    return payload
