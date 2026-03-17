import json
import re

# NOTE: Simplified implementation for scaffolding purpose.

def strip_json_comments(data_content: str) -> str:
    """Removes standard JSON comments and returns compressed, standardized JSON string."""
    # Remove multiline comments /* */
    content = re.sub(r"/\*[\s\S]*?\*/", "", data_content)
    # Remove single-line comments // (simplified handling)
    content = re.sub(r"(?<!:)//.*", "", content)
    
    try:
        loaded_data = json.loads(content)
        # Ensures whitespace is minimized and key ordering is canonicalized for stable hashing
        return json.dumps(loaded_data, separators=(',', ':'), sort_keys=True)
    except json.JSONDecodeError:
        # Fallback if stripping results in temporarily invalid JSON structure
        return data_content
        

def get_stripped_hashable_content(path: str, method: str) -> bytes:
    """Retrieves artifact content and sanitizes it based on the specified hash method."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        raise RuntimeError(f"Artifact not found: {path}")

    if method == "SHA256_STRIPPED_COMMENTS":
        return strip_json_comments(content).encode('utf-8')
    
    elif method == "SHA256_STANDARD":
        return content.encode('utf-8')

    else:
        raise ValueError(f"Unknown hashing method encountered in registry: {method}")