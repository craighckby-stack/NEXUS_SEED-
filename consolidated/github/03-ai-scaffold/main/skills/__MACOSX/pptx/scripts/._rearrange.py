"""
File: rearrange.py
Description: A script to rearrange files and folders according to the project context.
"""

import pathlib
import shutil
import os

def rearrange_files(project_path: str):
    """
    Rearranges files and folders in the project directory.

    Args:
    - project_path (str): The path to the project directory.

    Returns:
    - None
    """
    # Get the project root directory
    project_root = pathlib.Path(project_path).resolve()

    # Check if the project root directory exists
    if not project_root.exists():
        raise FileNotFoundError("Project root directory does not exist.")

    # Move files to the frontend-design directory
    frontend_design_path = project_root / "skills" / "frontend-design"
    if not frontend_design_path.exists():
        os.makedirs(frontend_design_path)

    for file in project_root.glob("*"):
        if file.is_file() and "rearrange" not in file.name:
            shutil.move(file, frontend_design_path)

def main():
    project_path = os.getenv("PROJECT_PATH")
    if project_path:
        rearrange_files(project_path)
    else:
        print("PROJECT_PATH environment variable is not set.")

if __name__ == "__main__":
    main()