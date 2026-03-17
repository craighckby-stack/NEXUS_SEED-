# skills/frontend-design/__init__.py

"""Initializes frontend design development."""

import importlib.util
import os

# Load design direction from environment variable
DESIGN_DIRECTION = os.environ.get("DESIGN_DIRECTION")

# Load design tokens from design_direction module
def load_design_tokens():
    """Loads design tokens based on the design direction."""
    if DESIGN_DIRECTION not in ["Minimal SaaS", "Bold Editorial", "Soft & Organic", "Dark Neon", "Playful"]:
        raise ValueError("Invalid design direction")
    module_name = f"design_directions.{DESIGN_DIRECTION}"
    spec = importlib.util.find_spec(module_name)
    if spec:
        tokens = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tokens)
        return tokens
    else:
        raise ImportError(f"Failed to load design direction: {DESIGN_DIRECTION}")

# Load components and utilities from design tokens
def load_components(tokens):
    """Loads components and utilities based on the design tokens."""
    components = []
    utilities = []
    # Iterate through design tokens and load components and utilities
    for token_name in dir(tokens):
        token = getattr(tokens, token_name)
        if isinstance(token, dict) and "component" in token:
            components.append(token["component"])
        elif isinstance(token, dict) and "utility" in token:
            utilities.append(token["utility"])
    return components, utilities

# Load theme and theme provider from design tokens
def load_theme(tokens):
    """Loads theme and theme provider based on the design tokens."""
    theme = {
        "colors": tokens.colors,
        "typography": tokens.typography,
        "spacing": tokens.spacing,
    }
    theme_provider = tokens.ThemeProvider
    return theme, theme_provider