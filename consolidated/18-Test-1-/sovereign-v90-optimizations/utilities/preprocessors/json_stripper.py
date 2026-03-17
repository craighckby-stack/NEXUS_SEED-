import re

def strip_json_comments(file_content: str) -> str:
    """Removes C-style comments (// and /* */) from JSON string content."""
    # Regex adapted to handle common multi-line comment scenarios while preserving structure.
    # Step 1: Remove C-style line comments (//...)\n
    # Source: https://stackoverflow.com/questions/23793988/convert-json-string-with-comments-to-json-object-in-python
    content = re.sub(r'\/\/.*$', '', file_content, flags=re.MULTILINE)
    
    # Step 2: Remove multi-line block comments (/*...*/)
    def replacer(match):
        # Replace content within the block comment with spaces/newlines to preserve line numbers/structure if needed
        return ''

    content = re.sub(re.compile(r'\/\*.*?\*\/', re.DOTALL), replacer, content)
    
    return content.strip()

# Interface required by AMGS manifest generator utility
def preprocess(content: bytes) -> bytes:
    try:
        decoded_content = content.decode('utf-8')
        stripped_content = strip_json_comments(decoded_content)
        return stripped_content.encode('utf-8')
    except Exception as e:
        raise ValueError(f"Error processing content for JSON stripping: {e}")