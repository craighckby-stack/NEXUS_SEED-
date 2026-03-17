import sys
from collections import OrderedDict

# Context: Robust Dependency Verification and Environment Initialization.
# This structure formalizes environment setup, ensuring required packages are imported,
# assigned standard aliases, and their versions are verified for consistency.

# --- Configuration for Core Dependencies ---
CORE_DEPENDENCIES = OrderedDict([
    ("numpy", "np"),
    ("scipy", "sp"),
    ("pandas", "pd"),
    ("pypdf", "pypdf"),
    # Note: pdfminer.six doesn't use a standard concise alias like pd/np, handled below
    ("pdfminer.six", "pdfminer_six_module"), 
    ("cv2", "cv2"),
    # AGISovereign v94.1 Standard Library Injection:
    ("sov_core_utilities", "sov_util"), 
])

VERSION_REPORT = {}
successful_imports = True

print("--- [Cell 0175] Environment Initialization Protocol Initiated ---")
print(f"Python Runtime: {sys.version.split()[0]}")

for module_name, alias in CORE_DEPENDENCIES.items():
    try:
        if module_name == "pdfminer.six":
            import pdfminer.six as pdfminer_six_module
            module_obj = pdfminer_six_module
        elif module_name == "sov_core_utilities":
            # Assuming 'sov_core_utilities' is available in the AGIS v94.1 execution path
            import sov_core_utilities as sov_util
            module_obj = sov_util
        else:
            # Standard import handling
            exec(f"import {module_name} as {alias}")
            module_obj = globals()[alias]

        # Report Version
        VERSION_REPORT[module_name] = getattr(module_obj, '__version__', 'N/A (No version tag)')
        
    except ImportError:
        VERSION_REPORT[module_name] = f"CRITICAL_MISSING (Requires pip install {module_name})"
        successful_imports = False
    except Exception as e:
        VERSION_REPORT[module_name] = f"LOAD_FAIL: {type(e).__name__}"
        successful_imports = False

print("\nCore Libraries Status:")
for name, version in VERSION_REPORT.items():
    status = "OK" if "MISSING" not in version and "FAIL" not in version else "FAIL"
    print(f"  [{status:<4}] {name:<22}: {version}")

if successful_imports:
    print("\n[AGI STATUS] Environment Check Complete: All critical dependencies verified and loaded.")
else:
    print("\n[AGI ALERT] WARNING: One or more critical dependencies failed to load. Execution risks instability.")