"""
Initialization script for validation module.

Provides an entry point for the validation module, handling imports and setup.
"""

import importlib
import os

# Define the validation module path
VALIDATION_MODULE_PATH = os.path.dirname(__file__)

# Import the validation module
validation_module = importlib.import_module(
    '.'.join([VALIDATION_MODULE_PATH, 'validation']),
    package='skills.__MACOSX.docx.ooxml.scripts.validation'
)

# Set up the validation module
validation_module.configure()

# Expose the validation module
__all__ = ['validation_module']
```

**