# CPR Utility: Constraint Pre-Resolver Simulation Tool
# Stage S09 Execution - Refactored for Robustness, Traceability, and Decoupling

import json
import sys
import time
import logging
from typing import Dict, Any, Optional, Union, List, TypedDict
from pathlib import Path

# --- 0. Logging Configuration ---

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - [%(module)s] %(message)s')
logger = logging.getLogger('S09.CPRSIM')

# --- 1. Custom Exceptions for Controlled Exit Signaling ---

class CPRToolError(Exception):
    """Base exception for CPR Simulation Tool errors (S09)."""
    pass

class ArtifactLoadingError(CPRToolError):
    """Raised when a required artifact cannot be found or is corrupted."""
    def __init__(self, message, error_code: Optional[int] = None):
        super().__init__(message)
        self.error_code = error_code

class SimulationExecutionError(CPRToolError):
    """Raised if the ACVM execution environment fails unexpectedly."""
    pass

# --- 2. Type Aliases & Structured Data ---

ACVMConfig = Dict[str, Any]
SimulationResults = Dict[str, bool] # Maps constraint ID to success status

class SimulationReport(TypedDict):
    """Defines the structure of the S09 output report."""
    stage: str
    timestamp: int
    execution_duration_sec: float
    overall_success: bool
    detailed_results: SimulationResults
    source_artifact_paths: Dict[str, str]
    
ArtifactMap = Dict[str, Union[str, Dict[str, Any]]] 

# NOTE: Dependency Check: ACVMProcessor is assumed core dependency
try:
    from system.acvm.acvm_processor import ACVMProcessor
except ImportError as e:
    # Critical IH Precursor signal for missing dependency
    logger.critical(f"Required system component ACVMProcessor failed to import: {e}. Exiting.")
    sys.exit(1) # Exit signal 1: System component failure


class ArtifactLoader:
    """Utility class to safely load structured artifacts and raise controlled exceptions."""
    @staticmethod
    def load(path: str) -> Dict[str, Any]:
        """Loads a JSON file robustly."""
        if not path:
            raise ArtifactLoadingError("Artifact path cannot be empty.", error_code=101)
        
        path_obj = Path(path)
        
        try:
            content = path_obj.read_text(encoding='utf-8')
            return json.loads(content)
        except FileNotFoundError:
            raise ArtifactLoadingError(
                f"Required artifact not found: {path}. Check artifact cache state.", error_code=102
            )
        except json.JSONDecodeError:
            raise ArtifactLoadingError(
                f"Invalid JSON structure in artifact: {path}. Data corruption detected.", error_code=103
            )
        except Exception as e:
            # Catch generalized I/O errors (permissions, network, OS) or missing permissions.
             raise ArtifactLoadingError(f"I/O error loading artifact {path}: {e}", error_code=104)


class CPRSimulator:
    """
    Manages the S09 Constraint Pre-Resolution (CPR) simulation execution.
    Handles artifact ingestion, validation orchestration, and reporting.
    """

    def __init__(self, cpr_config: Dict[str, Any], acvm_config: ACVMConfig):
        """Initializes the simulator with core ACVM configuration and CPR tool settings."""
        self.config = cpr_config
        # Use pathlib.Path internally for robustness
        self.report_output_path: Path = Path(self.config.get('report_output_path', 'output/s09_cpr_metrics.json'))
        self.required_artifact_keys: List[str] = self.config.get('required_artifacts', ['GAX_I', 'GAX_II', 'GAX_III'])
        
        logger.info("[CPR_INIT] Initializing ACVM Processor.")
        self.processor = ACVMProcessor(acvm_config)

    def _load_and_validate_artifacts(self, artifact_path_map: Dict[str, str]) -> ArtifactMap:
        """Helper to load all required GAX artifacts."""
        staged_artifacts: ArtifactMap = {}
        logger.info(f"Validating {len(self.required_artifact_keys)} critical artifacts...")
        
        for key in self.required_artifact_keys:
            path = artifact_path_map.get(key)
            if not path:
                raise CPRToolError(
                    f"Missing path configuration for required artifact: {key}. Defined requirements: {self.required_artifact_keys}"
                )
            
            try:
                staged_artifacts[key] = ArtifactLoader.load(path)
                logger.debug(f"Successfully loaded {key} artifact from {path}")
            except ArtifactLoadingError as e:
                # Contextual re-raise to halt execution with clear context
                raise CPRToolError(f"Failed to ingest artifact {key}: {e}")
                
        return staged_artifacts
        
    def _save_report(self, report: SimulationReport, output_path: Path):
        """Writes the generated simulation report to disk, ensuring directory existence."""
        try:
            # Ensure the output directory exists before writing
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=4)
            logger.info(f"[CPR SAVE] Metrics report saved to {output_path.resolve()}")
        except IOError as e:
            raise CPRToolError(f"Could not save report to {output_path}: I/O failure ({e})")

    def run_pre_resolution(self, artifact_path_map: Dict[str, str]) -> SimulationReport:
        """
        Executes the S09 simulation run, verifying constraints against staged GAX data.

        Args:
            artifact_path_map: Dictionary mapping internal GAX identifiers to file paths.
        
        Returns:
            SimulationReport: The complete report dictionary.
        """
        
        # 1. Load Artifacts
        staged_artifacts = self._load_and_validate_artifacts(artifact_path_map)

        # 2. Run Simulation
        logger.info("Initiating constraint evaluation using ACVM Processor...")
        start_time = time.time()
        
        try:
            results: SimulationResults = self.processor.run_simulation(staged_artifacts)
        except Exception as e:
            # Catch failure originating from the core processor logic
            raise SimulationExecutionError(f"ACVM Processor reported an internal failure during simulation: {e}")

        duration = time.time() - start_time

        # 3. Generate Report (Using the TypedDict structure)
        overall_success = all(results.values())
        report: SimulationReport = {
            'stage': 'S09_CPR_PRE_COMMIT',
            'timestamp': int(time.time()), 
            'execution_duration_sec': round(duration, 4),
            'overall_success': overall_success,
            'detailed_results': results,
            'source_artifact_paths': artifact_path_map
        }
        
        # 4. Critical Signaling Check (Logging)
        if not overall_success:
            logger.warning("Pre-Commit Constraint Failure Detected. Signaling RRP (Required Rework Protocol) initiation.")
        else:
            logger.info("All S09 constraints validated successfully. Ready for commit.")
        
        # 5. Save Report
        self._save_report(report, self.report_output_path)

        return report

def load_cpr_config() -> Dict[str, Any]:
    """Loads CPR tool specific configuration, externalizing paths and defaults.
       NOTE: This function would ideally interface with a ConfigurationManager."""
    
    CPR_CONFIG_PATH = 'config/cpr_tool_config.json'
    
    try:
        config = ArtifactLoader.load(CPR_CONFIG_PATH)
        logger.info(f"Configuration loaded from {CPR_CONFIG_PATH}")
        return config
    except CPRToolError:
        logger.warning(f"CPR Config file not found or load failed. Using built-in internal defaults.")
        # Fallback config defines expected defaults and required auxiliary config location
        return {
            'report_output_path': 'output/s09_cpr_metrics.json',
            'required_artifacts': ['GAX_I', 'GAX_II', 'GAX_III'],
            'acvm_config_path': 'config/acvm_core_constraints.json'
        }

def main():
    logger.info("Starting CPR Simulation Tool (S09) initialization.")
    
    try:
        # 1. Load Configurations
        CPR_TOOL_CONFIG = load_cpr_config()
        
        ACVM_PATH = CPR_TOOL_CONFIG.get('acvm_config_path')
        if not ACVM_PATH:
             raise CPRToolError("Configuration item 'acvm_config_path' is missing or empty.")
             
        acvm_config = ArtifactLoader.load(ACVM_PATH)

        # NOTE: Artifact Path Definition: Hardcoded here for example, but should be injected externally.
        PATHS_MAPPING = {
            'GAX_I': 'artifact_cache/temm_s08.json', 
            'GAX_II': 'artifact_cache/ecvm_s07.json',
            'GAX_III': 'artifact_cache/csr_s01.json'
        }

        # 2. Initialize and Run
        simulator = CPRSimulator(cpr_config=CPR_TOOL_CONFIG, acvm_config=acvm_config)
        report = simulator.run_pre_resolution(artifact_path_map=PATHS_MAPPING)

        # 3. Handle Exit Signaling
        if not report['overall_success']:
            logger.critical("Simulation failed. RRP signal confirmed. Exiting with failure status 20.")
            sys.exit(20)
        else:
            logger.info("Simulation successful. S09 pre-commit validated.")

    except (CPRToolError, SimulationExecutionError) as e:
        logger.critical(f"[MAIN CRITICAL FAILURE] Execution failed during S09 resolution: {e}", exc_info=False)
        sys.exit(11) 
    except Exception as e:
        logger.critical(f"[MAIN UNEXPECTED FAILURE] An unhandled system error occurred: {e}", exc_info=True)
        sys.exit(99)

if __name__ == "__main__":
    main()