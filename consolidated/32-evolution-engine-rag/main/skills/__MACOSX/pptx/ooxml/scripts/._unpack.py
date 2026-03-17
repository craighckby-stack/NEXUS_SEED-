# skills/pptx/ooxml/scripts/unpack.py

import os
import zipfile
import sys

def validate_file_path(file_path: str) -> None:
    """
    Validates if the file exists and is a valid path.

    Args:
    file_path (str): The path to the file.
    """
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"The file {file_path} does not exist.")

def extract_zip_archive(zip_file_path: str, extract_path: str) -> None:
    """
    Extracts a zip archive to the specified path.

    Args:
    zip_file_path (str): The path to the zip file.
    extract_path (str): The path to extract the zip archive.
    """
    try:
        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
    except zipfile.BadZipFile:
        raise ValueError(f"The file {zip_file_path} is not a valid zip archive.")

def unpack_pptx(file_path: str) -> None:
    """
    Unpacks a PPTX file.

    Args:
    file_path (str): The path to the PPTX file.
    """
    validate_file_path(file_path)
    extract_path = os.path.splitext(file_path)[0]
    extract_zip_archive(file_path, extract_path)

def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python unpack.py <file_path>")
    else:
        unpack_pptx(sys.argv[1])

if __name__ == "__main__":
    main()