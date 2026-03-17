from pathlib import Path
from typing import List, Optional, Tuple, Any
import re

class SchemaVersionResolverError(Exception):
    """Error specific to version resolution failures."""
    pass

class SchemaVersionResolver:
    """
    Utility component to scan artifact directories and resolve abstract version requests
    (e.g., 'latest', '2.x.x', '1.2.*') to the highest available concrete directory version.
    
    NOTE: This implementation provides enhanced custom version sorting but should be replaced
    by 'packaging.version' for full PEP 440 compliance in production.
    """
    
    # Simple X.Y.Z regex for core numeric parts
    VERSION_PATTERN = re.compile(r"^(\d+)(?:\.(\d+))?(?:\.(\d+))?.*$") 

    @staticmethod
    def _parse_version_key(version_string: str) -> Tuple[Any, ...]:
        """
        Generates a key for sorting semantic version strings numerically.
        Handles X.Y and X.Y.Z formats robustly against lexicographical issues (e.g., 1.10.0 vs 1.9.0).
        """
        match = SchemaVersionResolver.VERSION_PATTERN.match(version_string)
        if match:
            parts = [int(p) if p else -1 for p in match.groups()]
            
            # Key consists of: (Major, Minor, Patch, full string tiebreaker)
            # We ensure non-specified parts are low (-1) to prioritize longer versions (e.g., 1.2.0 > 1.2)
            return tuple(parts) + (version_string,)
        
        # Fallback for non-standard or highly complex strings
        return tuple([int(x) if x.isdigit() else x for x in version_string.split('.')])


    @staticmethod
    def _list_candidate_versions(artifact_dir: Path) -> List[str]:
        """Scans the directory and returns a sorted list of potential version strings."""
        if not artifact_dir.is_dir():
            return []
        
        # Filter for directories that start with a digit, common in versioning.
        version_candidates = [
            item.name for item in artifact_dir.iterdir()
            if item.is_dir() and item.name[:1].isdigit()
        ]

        # Sort using the improved internal version parser key
        return sorted(
            version_candidates, 
            key=SchemaVersionResolver._parse_version_key
        )

    @staticmethod
    def find_latest_numeric_version(artifact_dir: Path) -> Optional[str]:
        """Returns the highest available semantic version string."""
        sorted_versions = SchemaVersionResolver._list_candidate_versions(artifact_dir)
        return sorted_versions[-1] if sorted_versions else None

    @classmethod
    def resolve_version(cls, artifact_dir: Path, requested_version: str) -> str:
        """
        Resolves the requested version, supporting 'latest' and basic X.Y.x wildcard matching.
        """
        available_versions = cls._list_candidate_versions(artifact_dir)
        
        # --- 1. Handle Explicit 'latest' Request ---
        if requested_version == 'latest':
            # Check for literal 'latest' directory (e.g., symlink)
            if (artifact_dir / 'latest').is_dir():
                return 'latest'
            
            # Fallback to the highest numeric version
            highest_version = available_versions[-1] if available_versions else None
            if highest_version:
                return highest_version
            
            raise SchemaVersionResolverError(
                f"Could not resolve 'latest' version for artifact in {artifact_dir}."
            )

        # --- 2. Handle Wildcard Requests (e.g., '1.x', '2.5.*') ---
        if 'x' in requested_version.lower() or '*' in requested_version:
            
            # Convert request pattern to regex pattern, treating 'x' and '*' as digits
            pattern = requested_version.lower().replace('.', r'\.').replace('x', r'\d+').replace('*', r'\d+')
            # Ensure exact match boundary
            pattern = r'^' + pattern + r'$'
            
            matching_versions = []
            try:
                version_re = re.compile(pattern)
                for version in available_versions:
                    if version_re.match(version):
                        matching_versions.append(version)
            except re.error as e:
                 raise SchemaVersionResolverError(f"Invalid wildcard pattern: {requested_version}. Error: {e}")
            
            if matching_versions:
                # Since available_versions is pre-sorted, the last match is the highest valid version.
                return matching_versions[-1]
            
            raise SchemaVersionResolverError(
                f"Could not find a version matching '{requested_version}' in {artifact_dir}."
            )

        # --- 3. Handle Explicit Numeric Request ---
        # Return the request, relying on the caller (Schema Registry) to check if the directory exists.
        return requested_version
