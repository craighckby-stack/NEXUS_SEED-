"""
PPTX Validation Script

This script validates the structure and contents of a .pptx file.
It checks for required elements, attributes, and ensures consistency
across the presentation.

Usage:
    python pptx_validator.py <input_file>

Arguments:
    input_file (str): Path to the .pptx file to validate

Returns:
    bool: True if the file is valid, False otherwise
"""

import zipfile
from xml.etree import ElementTree as ET

def validate_pptx(file_path):
    """
    Validate the structure and contents of a .pptx file.

    Args:
        file_path (str): Path to the .pptx file to validate

    Returns:
        bool: True if the file is valid, False otherwise
    """
    # Open the zip archive
    with zipfile.ZipFile(file_path) as zip_file:
        # Read the contents of the 'ppt' directory
        ppt_dir = zip_file.namelist()[0]

        # Check for required elements in the 'pkg' directory
        for element in ['[Content_Types].xml', '_rels/.rels']:
            if element not in zip_file.namelist():
                return False

        # Check for required elements in the 'ppt' directory
        required_elements = ['slideMaster1.xml', 'slideLayout1.xml', 'notesMaster1.xml']
        for element in required_elements:
            if element not in zip_file.namelist():
                return False

        # Parse the 'slideMaster1.xml' file
        slide_master_xml = zip_file.read('ppt/slides/slideMaster1.xml').decode('utf-8')
        tree = ET.fromstring(slide_master_xml)

        # Check for required attributes in the 'slideMaster' element
        if not tree.attrib.get('name') or not tree.attrib.get('title'):
            return False

    # If all checks pass, the file is valid
    return True

# Example usage
if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2:
        print("Usage: python pptx_validator.py <input_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    if validate_pptx(file_path):
        print("The file is valid.")
    else:
        print("The file is invalid.")