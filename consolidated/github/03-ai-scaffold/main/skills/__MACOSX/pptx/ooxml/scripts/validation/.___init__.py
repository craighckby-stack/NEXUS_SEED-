# skills/frontend-design/__init__.py

"""
Initialization for the Frontend Design skill.
"""

__all__ = ["validate", "generate_design_tokens", "build_components"]

import clsx
import json
import os
import postcss
import tailwindcss

def validate(project_path: str) -> bool:
    """
    Validate the project against the Frontend Design standards.
    
    Args:
    project_path (str): The path to the project directory.
    
    Returns:
    bool: True if the project is valid, False otherwise.
    """
    # Check for required files
    required_files = ["tailwind.config.js", "globals.css"]
    for file in required_files:
        if not os.path.exists(os.path.join(project_path, file)):
            return False
    
    # Validate Tailwind config
    try:
        tailwindcss.parse(
            open(os.path.join(project_path, "tailwind.config.js")).read()
        )
    except Exception as e:
        print(f"Error parsing Tailwind config: {e}")
        return False
    
    # Check for design tokens
    try:
        with open("design-tokens.json", "r") as f:
            design_tokens = json.load(f)
    except FileNotFoundError:
        print("Error: Design tokens not found.")
        return False
    
    # Check for component styles
    try:
        with open("components.css", "r") as f:
            component_styles = postcss.parse(f.read())
    except FileNotFoundError:
        print("Error: Component styles not found.")
        return False
    
    return True

def generate_design_tokens(token_system: dict) -> None:
    """
    Generate design tokens based on the provided token system.
    
    Args:
    token_system (dict): The token system to generate tokens from.
    
    Returns:
    None
    """
    # Generate color tokens
    color_tokens = {
        f"--color-{color_name}": color_value
        for color_name, color_value in token_system["colors"].items()
    }
    
    # Generate typography tokens
    typography_tokens = {
        f"--font-size-{font_size}": font_size_value
        for font_size, font_size_value in token_system["typography"].items()
    }
    
    # Generate spacing tokens
    spacing_tokens = {
        f"--spacing-{spacing_value}": spacing_value
        for spacing_value in token_system["spacing"].values()
    }
    
    # Write tokens to file
    with open("design-tokens.json", "w") as f:
        json.dump(
            {
                "colors": color_tokens,
                "typography": typography_tokens,
                "spacing": spacing_tokens,
            },
            f,
            indent=4,
        )

def build_components(component_templates: dict) -> None:
    """
    Build components using the provided component templates.
    
    Args:
    component_templates (dict): The component templates to build.
    
    Returns:
    None
    """
    # Build each component
    for component_name, component_template in component_templates.items():
        # Create component file
        with open(f"{component_name}.css", "w") as f:
            # Write component styles
            f.write(component_template)