# _document.py: Refactored for improvements in readability and performance

"""
Document script for skills documentation.

This script provides a basic structure for documentation generation.
"""

import os
import shutil

def generate_documentation(project_path: str) -> None:
    """
    Generate documentation for the skills project.

    Args:
    project_path (str): Path to the project directory.
    """
    # Define constants for documentation directories
    DOC_DIR = 'docs'
    DOC_TEMPLATES = 'templates'
    DOC_OUTPUT = 'output'

    # Create documentation directories
    doc_dir = os.path.join(project_path, DOC_DIR)
    doc_templates_dir = os.path.join(doc_dir, DOC_TEMPLATES)
    doc_output_dir = os.path.join(doc_dir, DOC_OUTPUT)

    # Create directories
    os.makedirs(doc_dir, exist_ok=True)
    os.makedirs(doc_templates_dir, exist_ok=True)
    os.makedirs(doc_output_dir, exist_ok=True)

    # Copy templates to documentation directory
    shutil.copytree(os.path.join(project_path, 'templates'), doc_templates_dir)

    # Print success message
    print(f"Documentation generated in {doc_dir}")