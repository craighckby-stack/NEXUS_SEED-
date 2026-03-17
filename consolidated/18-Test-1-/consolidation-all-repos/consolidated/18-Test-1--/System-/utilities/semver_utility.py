from packaging.version import parse as parse_version, Version
from typing import List, Optional

def sort_semver_strings(versions: List[str], reverse: bool = True) -> List[str]:
    """
    Sorts a list of version strings using Semantic Versioning principles 
    (or similar standards like PEP 440) using the 'packaging' library.

    If 'packaging' is unavailable, falls back to a basic string sort.
    """
    if not versions:
        return []

    try:
        # Requires 'packaging' dependency for robust SemVer comparison (e.g., 1.10.0 > 1.9.0)
        versions.sort(key=parse_version, reverse=reverse)
        return versions
    except ImportError:
        print("Warning: 'packaging' library not found. Falling back to simple lexicographical version sort.")
        versions.sort(reverse=reverse)
        return versions

def get_latest_version(versions: List[str]) -> Optional[str]:
    """
    Returns the highest version string in the list based on SemVer rules.
    """
    sorted_versions = sort_semver_strings(versions, reverse=True)
    return sorted_versions[0] if sorted_versions else None

__all__ = ['sort_semver_strings', 'get_latest_version']
