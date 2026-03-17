# service/dse_metric_watchdog.py
import json
import logging
from typing import Dict, Any, Optional, Union, TypedDict

# Assuming a DSE Manager interface exists for system control
from governance.core_system import DSE_Manager 

logger = logging.getLogger('DSE_Watchdog')

# --- Data Structures for Clarity and Type Enforcement (ACVM Schema Proxy) ---

class ConstraintBoundary(TypedDict):
    """Defines the min/max numerical bounds for a specific metric."""
    min: float
    max: float

class ConstraintSet(TypedDict):
    """Maps metric keys to their required ConstraintBoundary."""
    # This is a dynamic mapping, used for typing hints
    pass 

class ACVMConfigSchema(TypedDict):
    """Root structure mapping Constraint IDs (GAX I/II/III) to their ConstraintSets."""
    # This is a dynamic mapping, used for typing hints
    pass

class ViolationReport(TypedDict):
    """Detailed structure describing a single P-M02 violation, carrying all context."""
    metric: str
    actual: float
    min_bound: float
    max_bound: float
    constraint_id: str

# --- Internal Constants ---
ARTIFACT_CONSTRAINT_MAPPING = {
    "CSR Snapshot": "GAX III",
    "ECVM Snapshot": "GAX II",
    "TEMM Snapshot": "GAX I" 
}
ACVM_CONFIG_PATH_DEFAULT = 'config/acvm.json'

# --- Custom Exceptions for DSE System Robustness ---
class DSEWatchdogError(Exception):
    """Base exception for the Watchdog system."""
    pass

class ACVMIntegrityError(DSEWatchdogError):
    """Raised when the ACVM configuration is corrupt, missing required fields, or fails schema validation."""
    pass

# P-M02: Fail-Fast Halt Protocol Exception - Decouples detection from execution
class ConstraintViolationTrigger(DSEWatchdogError):
    """Exception used internally to immediately signal a halt requirement with necessary payload."""
    def __init__(self, violation: ViolationReport):
        super().__init__(f"P-M02 Constraint Violation detected: {violation['metric']} out of bounds.")
        self.violation = violation


class DSEMetricWatchdog:
    """
    Active agent responsible for real-time monitoring of GAX artifact telemetry 
    against predefined ACVM thresholds (P-M02). Triggers immediate Integrity Halt (IH)
    upon detection of threshold drift outside acceptable bounds between stages S01 and S08.
    """

    def __init__(self, acvm_path: str = ACVM_CONFIG_PATH_DEFAULT):
        self._acvm_path = acvm_path
        self.dse_manager = DSE_Manager()
        # ACVM is now strictly typed using ACVMConfigSchema proxy
        self.acvm_config: ACVMConfigSchema = self._load_and_validate_acvm()
        logger.info("DSEMetricWatchdog initialized successfully with validated ACVM.")

    def _load_and_validate_acvm(self) -> ACVMConfigSchema:
        """Loads and performs structural validation and type coercion on the ACVM configuration."""
        try:
            with open(self._acvm_path, 'r') as f:
                config = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError, OSError) as e:
            err_type = "FileNotFound" if isinstance(e, FileNotFoundError) else "JSONParsingError"
            err_msg = f"Critical DSE Dependency Failure ({err_type}): ACVM configuration at {self._acvm_path} failed loading. Error: {e}"
            logger.critical(err_msg)
            raise ACVMIntegrityError(err_msg)

        # 1. Strict check for all required constraint IDs (GAX I, II, III)
        required_constraints = set(ARTIFACT_CONSTRAINT_MAPPING.values())
        if not required_constraints.issubset(config.keys()):
            missing = required_constraints - set(config.keys())
            err_msg = f"ACVM schema validation failed. Missing core constraints: {missing}. (P-M02 Schema Violation)"
            logger.critical(err_msg)
            raise ACVMIntegrityError(err_msg)

        # 2. P-T01 Optimization: Pre-process and coerce threshold values to float
        processed_config: Dict[str, ConstraintSet] = {}
        for constraint_id, metrics in config.items():
            processed_metrics: ConstraintSet = {}
            if not isinstance(metrics, dict):
                 raise ACVMIntegrityError(f"ACVM data structure error in {constraint_id}. Metrics must be a dictionary.")

            for metric_key, thresholds in metrics.items():
                if not isinstance(thresholds, dict):
                    raise ACVMIntegrityError(f"ACVM structure error: Thresholds for {metric_key} are not a dictionary.")

                try:
                    # Robust handling of missing bounds using standard limits
                    min_val = float(thresholds.get("min", float('-inf')))
                    max_val = float(thresholds.get("max", float('inf')))
                    processed_metrics[metric_key] = ConstraintBoundary(min=min_val, max=max_val)
                except (ValueError, TypeError) as e:
                    err_msg = f"ACVM data integrity error in {constraint_id}. Thresholds for {metric_key} are invalid: {e}"
                    raise ACVMIntegrityError(err_msg)
            processed_config[constraint_id] = processed_metrics

        # Casting the processed configuration to the strict schema type
        return processed_config

    def ingest_telemetry(self, source_actor: str, artifact_name: str, metrics: Dict[str, Union[float, int]]):
        """ 
        Ingests high-fidelity metrics and synchronously evaluates them 
        against pre-validated ACVM thresholds (Fail-Fast Protocol).
        """
        
        constraint_id = ARTIFACT_CONSTRAINT_MAPPING.get(artifact_name)
        
        if not constraint_id:
            logger.warning(f"Unknown artifact '{artifact_name}' reported by {source_actor}. Skipping constraint evaluation.")
            return

        try:
            self._evaluate_constraints(constraint_id, metrics)
        except ConstraintViolationTrigger as e:
            # Catch the formalized halt signal and execute IH protocol, passing source context.
            self.trigger_halt(e.violation, source_actor)
        except Exception as e:
            # Handle unexpected runtime errors during evaluation gracefully
            logger.error(f"Unexpected error during telemetry evaluation for {artifact_name}: {e}")

    def _evaluate_constraints(self, constraint_id: str, metrics: Dict[str, Union[float, int]]):
        """Core logic for P-M02 violation detection, utilizing Fail-Fast exception flow."""
        
        required_checks: Optional[ConstraintSet] = self.acvm_config.get(constraint_id)
        
        if not required_checks:
            logger.debug(f"No configured constraints found for Constraint ID: {constraint_id}. Evaluation skipped.")
            return

        for metric_key, constraints in required_checks.items():
            current_value = metrics.get(metric_key)

            if current_value is None:
                logger.warning(f"Metric '{metric_key}' expected for {constraint_id} not found in telemetry data.")
                continue

            # Validate/Coerce numeric type
            if not isinstance(current_value, (float, int)):
                logger.warning(f"Telemetry metric {metric_key} is non-numeric ({type(current_value)}). Skipping comparison.")
                continue

            current_value_f = float(current_value)
            min_threshold = constraints["min"]
            max_threshold = constraints["max"]
            
            if current_value_f < min_threshold or current_value_f > max_threshold:
                # Violation detected. Prepare structured report.
                violation_data: ViolationReport = {
                    "constraint_id": constraint_id,
                    "metric": metric_key,
                    "actual": current_value_f,
                    "min_bound": min_threshold,
                    "max_bound": max_threshold
                }
                # Fail-Fast: Immediately signal the halt protocol using a structured exception
                raise ConstraintViolationTrigger(violation_data)

    def trigger_halt(self, violation: ViolationReport, source_actor: str):
        """
        Executes immediate Integrity Halt (IH), initiating P-R03 tracing procedures.
        Accepts a formalized ViolationReport object.
        """
        
        reason = (
            f"P-M02 Violation detected by DMW (Artifact Constraint Check). "
            f"Constraint ID: {violation['constraint_id']}. Metric '{violation['metric']}' "
            f"reported by {source_actor} ({violation['actual']}) "
            f"outside bounds [{violation['min_bound']}, {violation['max_bound']}]."
        )

        halt_details = {
            "policy": "P-M02",
            "source_actor": source_actor,
            "reason": reason,
            "metric": violation['metric'],
            "constraint_id": violation['constraint_id'],
            "actual_value": violation['actual'],
            "min_bound": violation['min_bound'],
            "max_bound": violation['max_bound']
        }
        
        logger.critical(f"INTEGRITY HALT (IH) TRIGGERED: {reason}", extra=halt_details)
        
        # Pass structured details to the manager for FDLS tracing and DIAL preparation
        self.dse_manager.initiate_integrity_halt(reason, details=halt_details)