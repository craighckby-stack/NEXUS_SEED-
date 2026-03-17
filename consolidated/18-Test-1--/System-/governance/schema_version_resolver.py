from pathlib import Path
from typing import List, Optional, Tuple, Any
import re
from itertools import chain

class SchemaVersionResolverError(Exception):
    """Error specific to version resolution failures."""
    pass

class SchemaVersionResolver:
    """
    Utility component to scan artifact directories and resolve abstract version requests
    (e.g., 'latest', '2.x.x', '1.2.*') to the highest available concrete directory version.
    
    Optimized for minimal directory iteration and efficient highest-version lookup.
    NOTE: This implementation sacrifices PEP 440 compliance for specialized sorting.
    """
    
    # Optimized regex to capture up to X.Y.Z numeric parts quickly.
    VERSION_PATTERN = re.compile(r"^(\d+)(?:\.(\d+))?(?:\.(\d+))?.*$") 

    @staticmethod
    def _parse_version_key(version_string: str) -> Tuple[Any, ...]:
        """
        Generates a key for sorting semantic version strings numerically.
        Handles X.Y and X.Y.Z formats robustly against lexicographical issues.
        """
        match = SchemaVersionResolver.VERSION_PATTERN.match(version_string)
        if match:
            # Convert matched parts to integers, using -1 for missing optional parts
            numeric_parts = tuple(int(p) if p else -1 for p in match.groups())
            # Use the full string as the final tie-breaker for efficiency
            return numeric_parts + (version_string,)
        
        # Fallback for complex non-standard versions (less efficient path)
        return tuple(chain.from_iterable(
            (int(x),) if x.isdigit() else (x,) for x in version_string.split('.')
        ))

    @staticmethod
    def _get_sorted_candidates(artifact_dir: Path) -> List[str]:
        """
        Scans the directory, filters for valid version directories, and returns 
        a list sorted from lowest to highest based on the version key.
        """
        if not artifact_dir.is_dir():
            return []
        
        # Filter for directories starting with a digit
        candidates = [
            item.name for item in artifact_dir.iterdir()
            if item.is_dir() and item.name and item.name[0].isdigit()
        ]

        return sorted(candidates, key=SchemaVersionResolver._parse_version_key)

    @classmethod
    def resolve_version(cls, artifact_dir: Path, requested_version: str) -> str:
        """
        Resolves the requested version, prioritizing efficiency by leveraging the 
        pre-sorted list for O(1) best-case lookup.
        """
        available_versions = cls._get_sorted_candidates(artifact_dir)
        
        # --- 1. Handle Explicit 'latest' Request ---
        if requested_version == 'latest':
            # Fast path: check for literal 'latest' directory
            if (artifact_dir / 'latest').is_dir():
                return 'latest'
            
            # Highest numeric version is the last item in the sorted list
            if available_versions:
                return available_versions[-1]
            
            raise SchemaVersionResolverError(
                f"Could not resolve 'latest' version for artifact in {artifact_dir}."
            )

        # --- 2. Handle Wildcard Requests (e.g., '1.x', '2.5.*') ---
        if 'x' in requested_version.lower() or '*' in requested_version:
            
            # Convert pattern to a compiled regex
            pattern_str = requested_version.lower().replace('.', r'\.').replace('x', r'\d+').replace('*', r'\d+')
            version_re = re.compile(r'^' + pattern_str + r'$')
            
            # Computational optimization: Iterate backwards. The first match found 
            # is guaranteed to be the highest version due to pre-sorting.
            for version in reversed(available_versions):
                if version_re.match(version):
                    return version
            
            raise SchemaVersionResolverError(
                f"Could not find a version matching '{requested_version}' in {artifact_dir}."
            )

        # --- 3. Handle Explicit Numeric Request ---
        # Return the request, relying on the caller to verify existence.
        return requested_version