# CPR Utility: Constraint Pre-Resolver Simulation Tool
# Stage S09 Execution - Refactored for Robustness and Traceability

import json
import sys
import time
import logging
from typing import Dict, Any, Optional, Union, List

# --- 0. Logging Configuration ---

# Use INFO level for standard operational traces
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('CPRSIM')

# --- 1. Custom Exceptions for Controlled Exit Signaling ---

class CPRToolError(Exception):
    """Base exception for CPR Simulation Tool errors (S09)."""
    pass

class ArtifactLoadingError(CPRToolError):
    """Raised when a required artifact cannot be found or is corrupted."""
    def __init__(self, message, error_code=None):
        super().__init__(message)
        self.error_code = error_code

# --- 2. Type Aliases for Clarity ---

ArtifactMap = Dict[str, Union[str, Dict[str, Any]]]
ACVMConfig = Dict[str, Any]
SimulationResults = Dict[str, bool] # Maps constraint ID to success status
SimulationReport = Dict[str, Any]

# NOTE: Assuming ACVMProcessor exists and handles run_simulation, get_current_time methods.
try:
    # Using absolute import for high-level components
    from system.acvm.acvm_processor import ACVMProcessor
except ImportError:
    # Critical IH Precursor signal for missing dependency
    logger.error("ACVMProcessor dependency not found or improperly path resolved. Exiting.")
    sys.exit(1) # Exit signal 1: System component failure


class ArtifactLoader:
    """Utility class to safely load structured artifacts and raise controlled exceptions."""
    @staticmethod
    def load(path: str) -> Dict[str, Any]:
        if not path:
            raise ArtifactLoadingError("Artifact path cannot be empty.", error_code=101)
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise ArtifactLoadingError(
                f"Required artifact not found: {path}. Check artifact cache state.", error_code=102
            )
        except json.JSONDecodeError:
            raise ArtifactLoadingError(
                f"Invalid JSON structure in artifact: {path}. Data corruption detected.", error_code=103
            )


class CPRSimulator:
    """
    Manages the S09 Constraint Pre-Resolution (CPR) simulation execution.
    Loads and validates staged GAX artifacts against core ACVM constraints.
    
    Refinement: Decoupled configuration via constructor injection.
    """

    def __init__(self, cpr_config: Dict[str, Any], acvm_config: ACVMConfig):
        """Initializes the simulator with core ACVM configuration and CPR tool settings."""
        self.config = cpr_config
        # Use config paths/keys, falling back to robust defaults if config manager fails.
        self.report_path_default: str = self.config.get('report_output_path', 'output/s09_cpr_metrics.json')
        self.required_artifact_keys: List[str] = self.config.get('required_artifacts', ['GAX_I', 'GAX_II', 'GAX_III'])
        
        logger.info(f"[CPR_INIT] Initializing ACVM Processor with provided configuration.")
        self.processor = ACVMProcessor(acvm_config)

    def run_pre_resolution(self, artifact_path_map: Dict[str, str], output_path: Optional[str] = None) -> SimulationReport:
        """
        Executes the S09 simulation run, verifying constraints against staged GAX data.

        Args:
            artifact_path_map: Dictionary mapping internal GAX identifiers to file paths.
            output_path: Optional path to save the metrics report.
        """
        
        # 1. Load and Verify Artifacts
        staged_artifacts: ArtifactMap = {}
        logger.info(f"[CPR_LOAD] Validating {len(self.required_artifact_keys)} artifact keys...")
        
        for key in self.required_artifact_keys:
            path = artifact_path_map.get(key)
            if not path:
                raise CPRToolError(
                    f"Missing required artifact path configuration for {key}. Keys required: {self.required_artifact_keys}"
                )
            
            # Loading logic centralized in ArtifactLoader
            try:
                staged_artifacts[key] = ArtifactLoader.load(path)
                logger.debug(f"[CPR_LOAD] Successfully loaded {key} artifact from {path}")
            except ArtifactLoadingError as e:
                # Re-raise with context to halt execution
                raise CPRToolError(f"Failed to load artifact {key}: {e}")

        # 2. Run Simulation
        logger.info("[CPR_SIM] Initiating constraint evaluation using ACVM Processor...")
        start_time = time.time()
        
        # The ACVM processor handles the core logic of comparing the artifacts against internal constraints
        results: SimulationResults = self.processor.run_simulation(staged_artifacts)
        
        duration = time.time() - start_time

        # 3. Generate Report
        overall_success = all(results.values())
        report: SimulationReport = {
            'stage': 'S09_CPR_PRE_COMMIT',
            'timestamp': int(time.time()), 
            'execution_duration_sec': round(duration, 4),
            'overall_success': overall_success,
            'detailed_results': results,
            'source_artifact_paths': artifact_path_map
        }
        
        # 4. Critical Signaling Check
        if not overall_success:
            logger.warning("[CPR ALERT S09] Pre-Commit Constraint Failure Detected. Signaling RRP (Required Rework Protocol) initiation.")
        else:
            logger.info("[CPR SUCCESS] All S09 constraints validated successfully.")
        
        # 5. Save Report
        final_output_path = output_path or self.report_path_default
        try:
            with open(final_output_path, 'w') as f:
                json.dump(report, f, indent=4)
            logger.info(f"[CPR SAVE] Metrics report saved to {final_output_path}")
        except IOError as e:
            # Raise instead of print/sys.exit, allowing calling context to handle failure
            raise CPRToolError(f"Could not save report to {final_output_path}: {e}")

        return report

def load_cpr_config() -> Dict[str, Any]:
    """Loads CPR tool specific configuration, externalizing paths and defaults."""
    CPR_CONFIG_PATH = 'config/cpr_tool_config.json'
    
    try:
        config = ArtifactLoader.load(CPR_CONFIG_PATH)
        logger.info(f"Configuration loaded from {CPR_CONFIG_PATH}")
        return config
    except CPRToolError:
        # Fallback to hardcoded internal defaults if configuration file is missing/corrupt.
        logger.warning(f"CPR Config file not found or load failed. Using built-in defaults.")
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
        
        ACVM_PATH = CPR_TOOL_CONFIG.get('acvm_config_path') # Retrieved from config or default
        acvm_config = ArtifactLoader.load(ACVM_PATH)

        # Artifact Path Definition (These typically vary per stage/run and might not belong in static config)
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
            logger.critical("[MAIN] Simulation failed. RRP signal confirmed. Exiting with failure status 20.")
            sys.exit(20) # Signal 20: Pre-Commit Constraint Violation
        else:
            logger.info("[MAIN] Simulation successful. S09 pre-commit validated.")

    except CPRToolError as e:
        # Handles specific operational or artifact loading errors
        logger.critical(f"[MAIN CRITICAL FAILURE] Execution failed during S09 resolution: {e}", exc_info=False)
        sys.exit(11) # Signal 11: Controlled runtime exception
    except Exception as e:
        # Catch unexpected Python errors
        logger.critical(f"[MAIN UNEXPECTED FAILURE] An unhandled system error occurred: {e}", exc_info=True)
        sys.exit(99) # Signal 99: Unexpected system error


if __name__ == "__main__":
    main()
