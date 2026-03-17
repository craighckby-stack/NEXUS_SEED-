# Import required modules
import re
from typing import Dict, List

# Define a function to validate CSS files
def validate_css(css_code: str) -> Dict[str, List[str]]:
    """
    Validates CSS code and returns a dictionary with error messages.
    
    Args:
    css_code (str): The CSS code to be validated.
    
    Returns:
    Dict[str, List[str]]: A dictionary containing error messages.
    """
    
    # Initialize the error dictionary
    errors: Dict[str, List[str]] = {"warnings": [], "errors": []}
    
    # Check for invalid characters in comments
    comments = re.findall(r"/\*.*?\*/", css_code, flags=re.DOTALL)
    for comment in comments:
        if re.search(r"[^a-zA-Z0-9\s]", comment):
            errors["errors"].append("Invalid characters in comment")
    
    # Check for unused media queries
    media_queries = re.findall(r"@media.*?\}", css_code)
    if media_queries:
        for query in media_queries:
            if not re.search(r"{.*?}", query):
                errors["warnings"].append("Unused media query")
    
    # Check for duplicate property declarations
    properties = re.findall(r"\s*([a-zA-Z-]+):\s*[^;]*;", css_code)
    for prop in properties:
        if properties.count(prop) > 1:
            errors["errors"].append(f"Duplicate property declaration: {prop}")
    
    return errors

# Define a function to validate JavaScript files
def validate_js(js_code: str) -> Dict[str, List[str]]:
    """
    Validates JavaScript code and returns a dictionary with error messages.
    
    Args:
    js_code (str): The JavaScript code to be validated.
    
    Returns:
    Dict[str, List[str]]: A dictionary containing error messages.
    """
    
    # Initialize the error dictionary
    errors: Dict[str, List[str]] = {"warnings": [], "errors": []}
    
    # Check for unused variables
    variables = re.findall(r"\blet\s+([a-zA-Z_$][\w$]*)\s*;", js_code)
    for var in variables:
        if not re.search(r"\b" + var + r"\b", js_code):
            errors["warnings"].append(f"Unused variable: {var}")
    
    # Check for unhandled promises
    promises = re.findall(r"\b([a-zA-Z_$][\w$]*)\s*=\s*new.*?\(", js_code)
    for prom in promises:
        if not re.search(r"\b" + prom + r"\.catch\(.*?\)", js_code):
            errors["warnings"].append(f"Unhandled promise: {prom}")
    
    return errors

# Define a function to validate HTML files
def validate_html(html_code: str) -> Dict[str, List[str]]:
    """
    Validates HTML code and returns a dictionary with error messages.
    
    Args:
    html_code (str): The HTML code to be validated.
    
    Returns:
    Dict[str, List[str]]: A dictionary containing error messages.
    """
    
    # Initialize the error dictionary
    errors: Dict[str, List[str]] = {"warnings": [], "errors": []}
    
    # Check for missing closing tags
    tags = re.findall(r"<[^>]*>", html_code)
    for tag in tags:
        if not re.search(r"</" + re.escape(tag) + r">", html_code):
            errors["errors"].append(f"Missing closing tag: {tag}")
    
    # Check for duplicate attribute names
    attributes = re.findall(r"\s*([a-zA-Z-]+)=[^>\s\"]+", html_code)
    for attr in attributes:
        if attributes.count(attr) > 1:
            errors["errors"].append(f"Duplicate attribute name: {attr}")
    
    return errors

# Define a function to validate file extensions
def validate_extensions(file_path: str) -> bool:
    """
    Validates file extensions and returns a boolean indicating validity.
    
    Args:
    file_path (str): The file path to be validated.
    
    Returns:
    bool: A boolean indicating file extension validity.
    """
    
    # Define valid extensions
    valid_extensions = [".css", ".js", ".html", ".json", ".yaml"]
    
    # Get file extension
    file_extension = "." + file_path.split(".")[-1]
    
    # Check if extension is valid
    return file_extension in valid_extensions

# Define a main function to run the validation
def main():
    # Get file paths from user
    file_paths = input("Enter file paths (comma-separated): ")
    
    # Split file paths
    file_paths = file_paths.split(",")
    
    # Validate each file
    for file_path in file_paths:
        # Check if file exists
        if not validate_extensions(file_path):
            print(f"Invalid file extension: {file_path}")
            continue
        
        # Read file content
        with open(file_path, "r") as file:
            file_content = file.read()
        
        # Determine file type
        if file_path.endswith(".css"):
            validation_errors = validate_css(file_content)
        elif file_path.endswith(".js"):
            validation_errors = validate_js(file_content)
        elif file_path.endswith(".html"):
            validation_errors = validate_html(file_content)
        else:
            print(f"Unsupported file type: {file_path}")
            continue
        
        # Print validation errors
        if validation_errors["errors"]:
            print(f"Validation errors in {file_path}:")
            for error in validation_errors["errors"]:
                print(f"- {error}")
        if validation_errors["warnings"]:
            print(f"Validation warnings in {file_path}:")
            for warning in validation_errors["warnings"]:
                print(f"- {warning}")

# Run the main function
if __name__ == "__main__":
    main()