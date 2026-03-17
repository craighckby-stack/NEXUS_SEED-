# Protocol Consistency Engine (PCE) V94.1 - Architectural Refactor
# Custodian: SGS (Execution Agent)

import json
import yaml
import logging
from typing import List, Dict, Union, TypedDict, Optional
from jsonschema import validate, ValidationError as SchemaValidationError
from functools import lru_cache
import os # Added for path manipulation context, even if mocked

# --- Setup Logging ---
logger = logging.getLogger(__name__)

# --- Data Structures & Type Hints ---

class ManifestDetails(TypedDict):
    path: str
    agent: str
    is_schema: bool 
    requires_version_check: bool

class PCEValidationResult(TypedDict):
    path: str
    status: str
    message: str
    agent: str

class PCEValidationError(Exception):
    """Custom exception for validation failures specific to PCE protocol errors."""
    pass

# NOTE V94.1: Configuration is now centralized and externalized to 'config/SGS/PCE_Registry.json'.
# The engine relies on the provided registry file path during initialization.


class ProtocolConsistencyEngine:
    """
    PCE V94.1:
    Ensures structural integrity and version synchronization across all 
    Triumvirate configuration manifests prior to GSEP-C Phase 2 (Axial Gating).
    
    Relies on configuration injection via a registry loaded in initialization.
    It pre-caches the critical Generic Agent Schema for improved performance.
    """
    
    def __init__(self, required_sag_version: str = "V94.3", registry_path: str = "config/SGS/PCE_Registry.json"):
        self.version = required_sag_version
        self.registry: List[ManifestDetails] = []
        self.generic_schema_path: Optional[str] = None
        self._generic_schema_cache: Optional[Dict] = None
        
        self._load_configuration(registry_path)

    def _load_configuration(self, registry_path: str):
        """
        Simulates loading the external PCE registry file (V94.1 Scaffold).
        Sets self.registry, self.generic_schema_path, and pre-loads the generic schema cache.
        """
        # --- MOCK START: Simulation of External Configuration Load ---
        mock_config = {
            "GENERIC_CONFIG_SCHEMA_PATH": "schema/SAG/GenericAgentConfig.schema.json",
            "MANIFEST_REGISTRY": [
                {"path": "config/GAX/UtilityFunctionRegistry.yaml", "agent": "GAX", "is_schema": False, "requires_version_check": True},
                {"path": "config/GAX/FinalityThresholdConfig.yaml", "agent": "GAX", "is_schema": False, "requires_version_check": True},
                {"path": "config/SGS/TargetEvolutionMandateManifest.yaml", "agent": "SGS", "is_schema": False, "requires_version_check": True},
                {"path": "schema/governance/Governance_State_Manifest.schema.json", "agent": "CRoT", "is_schema": True, "requires_version_check": False}
            ]
        }
        # --- MOCK END ---
        
        self.generic_schema_path = mock_config['GENERIC_CONFIG_SCHEMA_PATH']
        self.registry = mock_config['MANIFEST_REGISTRY']

        # Pre-load the common schema into memory cache
        try:
            self._generic_schema_cache = self._load_manifest(self.generic_schema_path)
            logger.info(f"Successfully pre-cached generic schema: {self.generic_schema_path}")
        except PCEValidationError as e:
            logger.critical(f"FATAL: Could not initialize PCE due to generic schema load failure: {e}")
            raise RuntimeError("PCE Initialization Failure: Generic Schema Inaccessible.")

    @lru_cache(maxsize=128)
    def _load_manifest(self, path: str) -> Union[Dict, List]:
        """Loads and caches manifest data. (Simulated File IO for V94.1) """
        try:
            if path.endswith(('.yaml', '.yml')):
                # Mock: Return data containing required version field
                content = {"protocol_version": self.version, "settings": {"timeout": 60}}
                return content
            elif path.endswith('.json'):
                if 'schema' in path:
                    # Mock: Return standard JSON schema content
                    return {"$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "$id": os.path.basename(path)}
                # Mock: Return standard JSON data manifest
                return {"protocol_version": self.version, "data_integrity_check": True}
            else:
                raise PCEValidationError(f"Unsupported manifest file type: {path}")

        except Exception as e: 
            raise PCEValidationError(f"Failed to load/parse manifest {path}: {type(e).__name__} - {e}")

    def _perform_integrity_check(self, details: ManifestDetails, manifest_data: Union[Dict, List]) -> PCEValidationResult:
        """Runs the complete suite of checks (structural, schema, version) for a single manifest."""
        path = details['path']
        agent = details['agent']

        # 1. Structural/Schema Validation Check
        if details['is_schema']:
            # A schema document must contain core JSON Schema definition keys
            if not isinstance(manifest_data, dict) or '$schema' not in manifest_data:
                raise PCEValidationError("Schema document validation failed: missing essential meta-keys.")
            # Note: A separate component (CRoT meta-validator) usually checks schema validity itself.
        else:
            # Data manifest validation against the globally consistent Generic Agent Schema (pre-cached)
            try:
                if not self._generic_schema_cache:
                    raise RuntimeError("Generic schema cache is uninitialized.")
                    
                validate(instance=manifest_data, schema=self._generic_schema_cache)
            except SchemaValidationError as e:
                # Granular reporting including path in the instance
                error_path = '/'.join(map(str, e.path))
                raise PCEValidationError(f"Generic Schema violation at /{error_path}: {e.message}")
        
        # 2. Version Synchronization Check
        if details['requires_version_check']:
            found_version = manifest_data.get('protocol_version')
            if found_version is None:
                 raise PCEValidationError("Required 'protocol_version' key missing.")
            if found_version != self.version:
                 raise PCEValidationError(f"Version mismatch. Expected {self.version}, found {found_version}")

        return {
            "path": path,
            "status": "PASS",
            "message": "Integrity, structural, and version synchronization checks passed.",
            "agent": agent
        }

    def check_consistency(self) -> Dict[str, Union[bool, List[PCEValidationResult]]]:
        """Executes comprehensive protocol consistency checks across all registered manifests."""
        results: List[PCEValidationResult] = []
        all_passed = True

        logger.info(f"PCE Stage S1: Starting consistency check against required SAG Version: {self.version}")

        if not self.registry:
            logger.warning("PCE Registry is empty. Consistency check bypassed.")
            return {"passed": True, "validation_results": []}
            
        for details in self.registry:
            path = details['path']
            
            try:
                manifest_data = self._load_manifest(path)
                result = self._perform_integrity_check(details, manifest_data)
                logger.debug(f"[PASS] {path}")
            
            except PCEValidationError as e:
                result = {"path": path, "status": "FAIL", "message": f"Validation Error: {str(e)}", "agent": details['agent']}
                all_passed = False
                logger.warning(f"[FAIL] {path} - {e}")
                
            except Exception as e:
                result = {"path": path, "status": "CRITICAL_FAIL", "message": f"Unexpected System Error: {type(e).__name__}", "agent": details['agent']}
                all_passed = False
                logger.critical(f"[CRIT FAIL] {path} - {e}")
            
            results.append(result)

        if not all_passed:
            logger.critical("[PCE HALT]: Protocol Consistency Check failed. Axal Gating (GSEP-C P2) aborted.")
        else:
            logger.info("[PCE PASS]: Triumvirate manifests are consistent.")
        
        return {
            "passed": all_passed,
            "validation_results": results
        }
