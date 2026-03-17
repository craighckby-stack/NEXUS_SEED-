import os
import threading
from pathlib import Path
import yaml
from typing import Dict, Any, Optional, List
from yaml import YAMLError

# Dependency Check: Fallback for version sorting
try:
    from utilities.semver_utility import get_latest_version
except ImportError:
    # IMPORTANT: Simple string sort fallback is error-prone for SemVer (e.g., 1.10 vs 1.2).
    # Using a slightly improved lexical sort as an emergency measure.
    def get_latest_version(versions: List[str]) -> Optional[str]:
        """Fall-back function using simple lexical sorting."""
        if not versions:
            return None
        versions.sort(key=lambda x: [int(c) if c.isdigit() else c for c in x.split('.')], reverse=True)
        return versions[0]

class SchemaRegistryError(Exception):
    """Base error for schema registry operations."""
    pass

class SchemaRegistry:
    """
    Centralized component for managing and retrieving versioned governance schemas.
    Implements in-memory caching with thread-safe access and intelligent resolution
    of the 'latest' version, ensuring robust SemVer handling if the utility is present.
    """
    
    # Internal cache structure: {artifact_name: {version: schema_dict}}
    _cache: Dict[str, Dict[str, Dict[str, Any]]]
    _cache_lock: threading.Lock

    def __init__(self, registry_root_path: str):
        # Use Path for cleaner path operations and ensure absolute path resolution
        self.registry_root = Path(registry_root_path).resolve()
        
        if not self.registry_root.is_dir():
            raise SchemaRegistryError(f"Registry root directory not found: {registry_root_path}")
            
        # Use standard dicts for internal cache management
        self._cache = {}
        # Introduce a lock for thread-safe access to the cache
        self._cache_lock = threading.Lock()
        
    def _get_schema_path(self, artifact_name: str, version: str) -> Path:
        """Helper to construct the canonical path."""
        # Enforce consistency: paths are lowercase
        standardized_name = artifact_name.lower()
        
        # Structure: <registry_root>/<artifact_name>/<version>/schema.yaml
        return self.registry_root / standardized_name / version / 'schema.yaml'

    def get_schema(self, artifact_name: str, version: str = 'latest') -> dict:
        """
        Retrieves a specific schema by artifact name and version.
        Handles cache lookup, disk load, and intelligent 'latest' resolution.
        """
        
        requested_version = version.lower()
        canonical_version = requested_version

        # 1. Resolve 'latest' if requested
        if canonical_version == 'latest':
            
            # Thread-safe read attempt for cached 'latest' mapping
            with self._cache_lock:
                artifact_cache = self._cache.get(artifact_name)
                # Check if we have previously resolved and cached the 'latest' schema
                if artifact_cache and (cached_latest := artifact_cache.get('latest')):
                    return cached_latest

            # If not cached, resolve the latest actual version from disk
            resolved_version = self._find_latest_version(artifact_name)
            if not resolved_version:
                raise SchemaRegistryError(
                    f"Schema '{artifact_name}' v'latest' not found. "
                    "No valid version directories detected."
                )
            
            # Update the target version to the resolved canonical version (e.g., '1.2.0')
            canonical_version = resolved_version 

        # 2. Check Cache using the resolved canonical version (or the explicitly requested version)
        with self._cache_lock:
            artifact_cache = self._cache.get(artifact_name)
            if artifact_cache and (schema := artifact_cache.get(canonical_version)):
                return schema

        # 3. Load from Disk
        schema_path = self._get_schema_path(artifact_name, canonical_version)
        try:
            schema_data = self._load_schema_file(schema_path)
        except FileNotFoundError:
            raise SchemaRegistryError(
                f"Schema '{artifact_name}' v'{canonical_version}' not found. "
                f"Attempted path: {schema_path}"
            )

        # 4. Store Cache (Thread-Safe Write)
        with self._cache_lock:
            # Initialize artifact cache if missing
            if artifact_name not in self._cache:
                self._cache[artifact_name] = {}
                
            # Cache under the canonical version (e.g., '1.2.0')
            self._cache[artifact_name][canonical_version] = schema_data
            
            # If the original request was 'latest', also cache under the 'latest' key
            # to serve subsequent 'latest' requests immediately from memory.
            if requested_version == 'latest':
                 self._cache[artifact_name]['latest'] = schema_data
        
        return schema_data

    def _load_schema_file(self, path: Path) -> dict:
        """Handles I/O and parsing of the schema file, with detailed error handling."""
        try:
            content = path.read_text(encoding='utf-8')
            return yaml.safe_load(content)
        except FileNotFoundError:
            # Let the caller handle the missing file
            raise
        except YAMLError as e:
            # Specific YAML parsing failure
            raise SchemaRegistryError(f"Failed to parse schema file {path} due to YAML error: {e}")
        except IOError as e:
            # General I/O errors (e.g., permissions)
            raise SchemaRegistryError(f"Failed to read schema file {path} due to I/O error: {e}")
        except Exception as e:
            # Catch unexpected errors during parsing/reading
            raise SchemaRegistryError(f"Unexpected error processing schema file {path}: {type(e).__name__} - {e}")
            
    def _find_latest_version(self, artifact_name: str) -> Optional[str]:
        """
        Scans directories to intelligently determine the highest valid version using
        the configured version utility.
        """
        artifact_root = self.registry_root / artifact_name.lower()
        
        if not artifact_root.is_dir():
            return None

        # Gather directories that contain a schema.yaml file (valid versions)
        valid_version_candidates = []
        for d in artifact_root.iterdir():
            if d.is_dir() and (d / 'schema.yaml').is_file():
                valid_version_candidates.append(d.name)
        
        if not valid_version_candidates:
            return None

        # Use the utility to find the canonical latest version
        return get_latest_version(valid_version_candidates)
