# __init__.py

"""
Initialize the scripts directory as a package.

This module automatically loads all modules in the package directory,
ensuring they are immediately available for import.
"""

import importlib.util
import pkgutil
import sys

def load_package():
    """Load all modules in the package directory."""
    package_path = __path__[0]
    for module_info in pkgutil.walk_packages(path=package_path, prefix=__name__ + "."):
        module_spec = importlib.util.spec_from_file_location(
            module_info.name,
            module_info.filename
        )
        module = importlib.util.module_from_spec(module_spec)
        sys.modules[module_info.name] = module
        module_spec.loader.exec_module(module)

load_package()
```

**