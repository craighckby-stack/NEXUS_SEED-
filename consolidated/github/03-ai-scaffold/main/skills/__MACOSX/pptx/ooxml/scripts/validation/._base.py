"""
Base validation script for skills
"""

import os
import sys
from importlib import util

# Define the base path for skills
BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILLS_PATH = os.path.join(BASE_PATH, 'skills')

# Define the script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Load the skill modules
skill_modules = {}
for file in os.listdir(SKILLS_PATH):
    if file.endswith('.py'):
        module_name = file[:-3]
        spec = util.module_from_spec(util.Loader(os.path.join(SKILLS_PATH, file)))
        sys.modules[module_name] = spec.load_module()
        skill_modules[module_name] = sys.modules[module_name]

# Define the validation function
def validate(skill):
    """Validate a skill"""
    # Check if the skill has a validate function
    if not hasattr(skill, 'validate'):
        print(f"Skill {skill.__name__} has no validation function")
        return False
    
    # Call the validate function
    return skill.validate()

# Define the main entry point
def main():
    """Run the validation script"""
    # Get the list of skills to validate
    skills_to_validate = [module for module in skill_modules.values() if hasattr(module, 'validate')]
    
    # Validate each skill
    for skill in skills_to_validate:
        if validate(skill):
            print(f"Skill {skill.__name__} is valid")
        else:
            print(f"Skill {skill.__name__} is invalid")

# Run the script
if __name__ == '__main__':
    main()