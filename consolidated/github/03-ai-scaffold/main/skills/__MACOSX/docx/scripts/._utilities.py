import os
import hashlib
from pathlib import Path

def get_file_hash(file_path, encoding='utf-8'):
    """
    Return the SHA-256 hash of a file.

    Args:
        file_path (str): Path to the file.
        encoding (str, optional): The encoding of the file. Defaults to 'utf-8'.

    Returns:
        str: The SHA-256 hash of the file.
    """
    with open(file_path, 'rb') as file:
        file_hash = hashlib.sha256(file.read()).hexdigest()
    return file_hash

def get_file_size(file_path):
    """
    Return the size of a file in bytes.

    Args:
        file_path (str): Path to the file.

    Returns:
        int: The size of the file in bytes.
    """
    return os.path.getsize(file_path)

def get_file_path_with_extension(file_path):
    """
    Return the file path with its extension.

    Args:
        file_path (str): Path to the file.

    Returns:
        str: The file path with its extension.
    """
    return os.path.join(os.path.dirname(file_path), os.path.basename(file_path))

def get_files_in_directory(directory_path):
    """
    Return a list of file paths in a directory.

    Args:
        directory_path (str): Path to the directory.

    Returns:
        list: A list of file paths in the directory.
    """
    return [file_path for file_path in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, file_path))]

def get_files_size_in_directory(directory_path):
    """
    Return a dictionary of file names and their sizes in a directory.

    Args:
        directory_path (str): Path to the directory.

    Returns:
        dict: A dictionary of file names and their sizes.
    """
    return {file_path: get_file_size(os.path.join(directory_path, file_path)) for file_path in get_files_in_directory(directory_path)}

def clean_directory(directory_path):
    """
    Remove all files in a directory.

    Args:
        directory_path (str): Path to the directory.
    """
    for file_path in get_files_in_directory(directory_path):
        os.remove(os.path.join(directory_path, file_path))

def get_md5_hash(input_string):
    """
    Return the MD5 hash of a string.

    Args:
        input_string (str): The input string.

    Returns:
        str: The MD5 hash of the string.
    """
    return hashlib.md5(input_string.encode('utf-8')).hexdigest()

def get_file_last_modified(file_path):
    """
    Return the last modified date of a file.

    Args:
        file_path (str): Path to the file.

    Returns:
        str: The last modified date of the file.
    """
    return datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d %H:%M:%S')

# Import datetime module for last modified date function
import datetime
```

**