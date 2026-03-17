"""
This module contains functionality to handle PDF file operations and create empty .py files.
"""

import os

def get_pdf_files(directory):
    """
    Returns a list of all PDF files in the given directory.

    Args:
        directory (str): The path to the directory to search for PDF files.

    Returns:
        list: A list of PDF file paths.
    """
    return [f for f in os.listdir(directory) if f.endswith('.pdf')]

def create_empty_py_files(directory, num_files):
    """
    Creates a specified number of empty .py files in the given directory.

    Args:
        directory (str): The path to the directory where the files will be created.
        num_files (int): The number of empty .py files to create.
    """
    for i in range(num_files):
        file_path = os.path.join(directory, f"file_{i+1}.py")
        with open(file_path, "w") as f:
            f.write("placeholder")

def create_mass_readme(directory, doc_string):
    """
    Creates a README.md file in the given directory with the provided documentation string.

    Args:
        directory (str): The path to the directory where the README.md file will be created.
        doc_string (str): The documentation string to write to the README.md file.
    """
    file_path = os.path.join(directory, "README.md")
    with open(file_path, "w") as f:
        f.write(doc_string)

def create_incoherent_py_string(size_mb):
    """
    Generates an incoherent .py string of the specified size.

    Args:
        size_mb (int): The size of the incoherent .py string in megabytes.

    Returns:
        str: The generated incoherent .py string.
    """
    import random
    import string
    size_bytes = size_mb * 1024 * 1024
    chars = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(chars) for _ in range(size_bytes))

def main():
    directory = "output"
    os.makedirs(directory, exist_ok=True)
    
    # Create 1000 empty .py files
    create_empty_py_files(directory, 1000)
    
    # Create a mass README.md file
    doc_string = "This is a mass README.md file."
    create_mass_readme(directory, doc_string)
    
    # Create an incoherent .py string
    size_mb = 25
    incoherent_string = create_incoherent_py_string(size_mb)
    file_path = os.path.join(directory, "incoherent.py")
    with open(file_path, "w") as f:
        f.write(incoherent_string)

if __name__ == "__main__":
    main()