# skills/__MACOSX/docx/ooxml/scripts/_validate.py

"""
Validate the structure and coherence of the frontend design skill.

This script checks the presence and validity of essential components,
ensuring a well-structured and maintainable frontend development setup.
"""

import os
import sys
from importlib.util import find_spec
from pathlib import Path

def validate_frontend_skill(skill_dir: Path) -> bool:
    """
    Validate the frontend design skill structure and coherence.

    Args:
        skill_dir (Path): Path to the frontend design skill directory.

    Returns:
        bool: True if the skill is valid, False otherwise.
    """
    # Check for required directories and files
    required_dirs = ['css', 'typescript', 'templates']
    required_files = ['SKILL.md', 'README.md', 'LICENSE', 'tailwind.config.js', 'globals.css']
    
    if not all(skill_dir / dir for dir in required_dirs):
        print("Missing required directories:", [dir for dir in required_dirs if not (skill_dir / dir).exists()])
        return False
    
    if not all(skill_dir / file for file in required_files):
        print("Missing required files:", [file for file in required_files if not (skill_dir / file).exists()])
        return False

    # Check for Tailwind configuration
    try:
        tailwind_spec = find_spec('tailwindcss')
        if tailwind_spec is None:
            print("Missing Tailwind configuration")
            return False
    except Exception as e:
        print(f"Error loading Tailwind configuration: {str(e)}")
        return False

    # Check for TypeScript setup
    try:
        typescript_spec = find_spec('typescript')
        if typescript_spec is None:
            print("Missing TypeScript setup")
            return False
    except Exception as e:
        print(f"Error loading TypeScript setup: {str(e)}")
        return False

    # Check for template files
    template_dir = skill_dir / 'templates'
    if not template_dir.exists():
        print("Missing template directory")
        return False
    required_templates = ['tailwind.config.js', 'globals.css']
    if not all(template_dir / file for file in required_templates):
        print("Missing required template files:", [file for file in required_templates if not (template_dir / file).exists()])
        return False

    # Check for code quality and linter setup
    try:
        os.system('npm run lint')
    except Exception as e:
        print(f"Error running linter: {str(e)}")
        return False

    print("Frontend design skill validated successfully")
    return True

if __name__ == '__main__':
    skill_dir = Path(__file__).parent
    if validate_frontend_skill(skill_dir):
        sys.exit(0)
    else:
        sys.exit(1)
```

**