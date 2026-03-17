import json
import os
from datetime import datetime, timezone
from typing import Dict, Any, List
from pathlib import Path

# --- Custom Governance Exceptions (Infrastructure/Robustness) ---
class GovernanceError(Exception):
    """Base exception for ACVD Governance violations."""
    pass

class ConfigurationError(GovernanceError):
    """Raised when configuration loading fails due to file or parsing issues."""
    pass

class StateTransitionError(GovernanceError):
    """Raised when an illegal state transition is attempted."""
    def __init__(self, previous_state, new_state, allowed_states, message="Illegal state transition"):
        super().__init__(message)
        self.previous_state = previous_state
        self.new_state = new_state
        self.allowed_states = allowed_states

class ValidationFailureError(GovernanceError):
    """Raised when an action is blocked due to validation failure."""
    def __init__(self, message, report=None):
        super().__init__(message)
        self.validation_report = report


def get_utc_timestamp() -> str:
    """Returns the current UTC timestamp formatted consistently for system logging."""
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

# Define default governance configuration for consistency and centralization
class ACVD_ConfigDefaults:
    """Centralized definition of default governance configuration parameters."""
    SCHEMA_VERSION = "1.1.3" # Version increment for heuristic persistence/abstraction
    DEFAULT_MIN_SAFETY_SCORE = 0.85
    DEFAULT_FALLBACK_WEIGHT = 0.30 
    DEFAULT_INTERNAL_PENALTY_MULTIPLIER = 0.5 
    DEFAULT_WEIGHT_ADJUSTMENT_SENSITIVITY = 0.005 # Threshold for tuning proposal stability
    DEFAULT_MAX_LOG_QUEUE_SIZE = 500 # Limit log queue size for performance/memory robustness
    DEFAULT_PERSIST_CONFIG = True # Control persistence of dynamic changes (Memory/Infrastructure)
    
    # Heuristic Parameters (Logic/Memory/Stability)
    DEFAULT_HEURISTIC_INCREASE_THRESHOLD = 1.6 # Deviation threshold for increasing weight (1.6x observed/expected ratio)
    DEFAULT_HEURISTIC_DECREASE_THRESHOLD = 0.4 # Deviation threshold for decreasing weight (0.4x observed/expected ratio)
    DEFAULT_MAX_ADJUSTMENT_RATE = 0.10 # Max proportional adjustment in one cycle (10% of remaining gap)
    DEFAULT_HEURISTIC_RESPONSIVENESS = 0.15 # Defines how aggressively the model adjusts weights based on deviation.
    
    # NEW: Structured Heuristic Config defaults for easier dynamic loading/persisting (Memory/Autonomy)
    HEURISTIC_CONFIG_DEFAULTS = {
        'heuristic_increase_threshold': DEFAULT_HEURISTIC_INCREASE_THRESHOLD,
        'heuristic_decrease_threshold': DEFAULT_HEURISTIC_DECREASE_THRESHOLD,
        'max_adjustment_rate': DEFAULT_MAX_ADJUSTMENT_RATE,
        'heuristic_responsiveness': DEFAULT_HEURISTIC_RESPONSIVENESS
    }
    
    # Base weights, used if no configuration is found in the schema (static reference)
    BASE_SEVERITY_WEIGHTS = {
        "CRITICAL": 0.40, 
        "STRUCTURAL_ERROR": 0.50, 
        "GOVERNANCE_VIOLATION": 0.45,
        "METRIC_FAILURE": 0.35,
        "DATA_TYPE_ERROR": 0.30,
        "STATE_ERROR": 0.40
    }
    
    # Defines how internal log levels map to governance issue types for penalty calculation (Abstraction)
    INTERNAL_ISSUE_MAP = {
        "CRITICAL": "CRITICAL",
        "ERROR": "STRUCTURAL_ERROR", 
        "WARNING": "GOVERNANCE_VIOLATION" 
    }


class ACVD_DecisionEngine:
    """Manages state transitions and validation enforcement based on the ACVD schema.

    This version enhances Meta-Reasoning and Autonomy by:
    1. Implementing configurable persistence control (`persist_config`).
    2. Making the dynamic weight tuning heuristics configurable and persistable, enhancing Memory retention.
    3. Introducing an atomic log consumption method (`get_and_clear_logs`) for robust Telemetry integration.
    """

    # Use centralized defaults for non-dynamic constants
    DEFAULT_MIN_SAFETY_SCORE = ACVD_ConfigDefaults.DEFAULT_MIN_SAFETY_SCORE
    DEFAULT_FALLBACK_WEIGHT = ACVD_ConfigDefaults.DEFAULT_FALLBACK_WEIGHT
    DEFAULT_INTERNAL_PENALTY_MULTIPLIER = ACVD_ConfigDefaults.DEFAULT_INTERNAL_PENALTY_MULTIPLIER
    DEFAULT_WEIGHT_ADJUSTMENT_SENSITIVITY = ACVD_ConfigDefaults.DEFAULT_WEIGHT_ADJUSTMENT_SENSITIVITY
    DEFAULT_MAX_LOG_QUEUE_SIZE = ACVD_ConfigDefaults.DEFAULT_MAX_LOG_QUEUE_SIZE
    _BASE_SEVERITY_WEIGHTS = ACVD_ConfigDefaults.BASE_SEVERITY_WEIGHTS
    _INTERNAL_ISSUE_MAP = ACVD_ConfigDefaults.INTERNAL_ISSUE_MAP
    
    def __init__(self, schema_path: str = 'governance/ACVD_schema.json'):
        # Use Path objects internally for robust file handling
        self.schema_path = Path(schema_path)
        self._log_queue: List[Dict[str, Any]] = [] # Infrastructure: Internal queue for Telemetry System

        # Initialize core attributes robustly
        self.schema: Dict[str, Any] = {}
        self.schema_version: str = ACVD_ConfigDefaults.SCHEMA_VERSION # Initialized default version
        self.valid_states: List[str] = []
        self.state_transitions: Dict[str, List[str]] = {}
        
        # Initialize configurable attributes (defaulted prior to loading)
        self.safety_threshold: float = self.DEFAULT_MIN_SAFETY_SCORE
        self.severity_weights: Dict[str, float] = self._BASE_SEVERITY_WEIGHTS.copy()
        self.internal_penalty_multiplier: float = self.DEFAULT_INTERNAL_PENALTY_MULTIPLIER
        self.max_log_queue_size: int = self.DEFAULT_MAX_LOG_QUEUE_SIZE
        self.persist_config: bool = ACVD_ConfigDefaults.DEFAULT_PERSIST_CONFIG # Initialize persistence control
        
        # Heuristic configuration storage (NEW: Memory/Autonomy)
        self._heuristic_config: Dict[str, float] = ACVD_ConfigDefaults.HEURISTIC_CONFIG_DEFAULTS.copy()
        
        self._load_configuration()
        
        if not self.valid_states:
            self._log_status(
                "WARNING", 
                "Schema initialized without defined states. Transitions may lack governance enforcement.", 
                "ACVD_INIT"
            )
        
        if self.safety_threshold == self.DEFAULT_MIN_SAFETY_SCORE and 'min_safety_score' not in self.schema.get('config', {}).keys():
             self._log_status(
                "INFO", 
                f"Using default safety score threshold: {self.DEFAULT_MIN_SAFETY_SCORE}", 
                "CONFIG_DEFAULT"
            )

    def _load_configuration(self):
        """Internal method to handle schema loading and configuration application."""
        try:
            loaded_schema = self._load_schema(self.schema_path)
            self.schema = loaded_schema
            # Load schema version (new)
            self.schema_version = self.schema.get('version', ACVD_ConfigDefaults.SCHEMA_VERSION)
            self.valid_states = self.schema.get('valid_states', []) 
            self.state_transitions = self.schema.get('state_transitions', {}) 
            config = self.schema.get('config', {})
        except ConfigurationError:
            # If schema loading fails critically, use default attributes initialized in __init__
            print(f"[ACVD CRITICAL | INIT_FAILSAFE @ {get_utc_timestamp()}] Failed to load governance schema. Operating in limited mode.")
            config = {} # Ensure config is empty for safe loading below
        except Exception:
            # Catch unexpected exceptions during initial load
            print(f"[ACVD CRITICAL | INIT_UNEXPECTED_FAIL @ {get_utc_timestamp()}] Unexpected error during schema load. Operating in limited mode.")
            config = {}
            
        # Load configurable thresholds
        self.safety_threshold = config.get(
            'min_safety_score', 
            self.DEFAULT_MIN_SAFETY_SCORE
        )
        
        # Load severity weights dynamically (supports Meta-Reasoning/Autonomy)
        self.severity_weights = self._BASE_SEVERITY_WEIGHTS.copy()
        self.severity_weights.update(config.get(
            'severity_weights',
            {}
        ))
        
        # Load internal penalty multiplier (supports Meta-Reasoning tuning)
        self.internal_penalty_multiplier = config.get(
            'internal_penalty_multiplier',
            self.DEFAULT_INTERNAL_PENALTY_MULTIPLIER
        )
        
        # Load max log queue size (Infrastructure/Robustness)
        self.max_log_queue_size = config.get(
            'max_log_queue_size',
            self.DEFAULT_MAX_LOG_QUEUE_SIZE
        )
        
        # Load Heuristic configuration (NEW: Memory/Autonomy)
        self._heuristic_config['heuristic_increase_threshold'] = config.get(
            'heuristic_increase_threshold',
            ACVD_ConfigDefaults.DEFAULT_HEURISTIC_INCREASE_THRESHOLD
        )
        self._heuristic_config['heuristic_decrease_threshold'] = config.get(
            'heuristic_decrease_threshold',
            ACVD_ConfigDefaults.DEFAULT_HEURISTIC_DECREASE_THRESHOLD
        )
        self._heuristic_config['max_adjustment_rate'] = config.get(
            'max_adjustment_rate',
            ACVD_ConfigDefaults.DEFAULT_MAX_ADJUSTMENT_RATE
        )
        self._heuristic_config['heuristic_responsiveness'] = config.get(
            'heuristic_responsiveness',
            ACVD_ConfigDefaults.DEFAULT_HEURISTIC_RESPONSIVENESS
        )
        
        # Load persistence control (Infrastructure Authority)
        self.persist_config = config.get(
            'persist_config',
            ACVD_ConfigDefaults.DEFAULT_PERSIST_CONFIG
        )

    def _log_status(self, level: str, message: str, context: str, details: Dict[str, Any] = None):
        """Standardized internal logging mechanism, queueing structured logs for Telemetry System integration.
        Enhanced to include structured details for richer meta-reasoning data and enforces queue size limit.
        """
        log_entry = {
            "timestamp": get_utc_timestamp(),
            "level": level,
            "message": message,
            "context": context,
            "details": details if details is not None else {} # Structured details for richer Meta-Reasoning
        }
        
        # 1. Append new log
        self._log_queue.append(log_entry)

        # 2. Enforce queue size limit (Robustness/Infrastructure)
        if len(self._log_queue) > self.max_log_queue_size:
            removed_count = len(self._log_queue) - self.max_log_queue_size
            # Prune oldest logs (removes from the start of the list)
            self._log_queue = self._log_queue[removed_count:]
            
        # Immediate console feedback for critical/error logs
        if level in ["CRITICAL", "ERROR", "WARNING"]:
            try:
                print(f"[ACVD {level} | {context} @ {log_entry['timestamp']}] {message}")
            except Exception:
                pass

    def _load_schema(self, path: Path) -> Dict[str, Any]:
        """Loads and parses the ACVD schema file with robust error handling (Pathlib integration).
        Uses custom ConfigurationError for structured error signaling.
        """
        
        if not path.exists():
            raise ConfigurationError(f"ACVD Schema not found at {path}.")
        
        try:
            content = path.read_text(encoding='utf-8')
            if not content.strip():
                self._log_status("ERROR", "ACVD Schema file is empty.", "SCHEMA_LOAD")
                raise ConfigurationError("ACVD Schema file is empty.")
            
            return json.loads(content)
        except json.JSONDecodeError as e:
            self._log_status("CRITICAL", f"Failed to parse ACVD Schema JSON at {path}. Malformed structure detected.", "JSON_PARSE_ERROR")
            raise ConfigurationError(f"Failed to parse ACVD Schema JSON at {path}. Malformed structure detected: {e}")
        except PermissionError:
            self._log_status("CRITICAL", f"Permission denied accessing ACVD Schema file at {path}.", "FILE_PERMISSION_ERROR")
            raise ConfigurationError(f"Permission denied accessing ACVD Schema file at {path}.")
        except Exception as e:
            self._log_status("CRITICAL", f"Unexpected error loading ACVD schema: {e}", "RUNTIME_ERROR")
            raise ConfigurationError(f"Unexpected error loading ACVD schema: {e}")
            
    def _save_schema(self):
        """Persists the current schema (including dynamically updated severity weights and heuristics)
        using an atomic write pattern (temp file) to ensure fault tolerance (Pathlib integration).
        """
        if not self.persist_config:
            self._log_status("DEBUG", "Schema persistence disabled by configuration.", "SCHEMA_PERSIST_SKIP")
            return

        save_data = self.schema.copy()
        
        # Persist current schema version
        save_data['version'] = self.schema_version
        
        if 'config' not in save_data:
            save_data['config'] = {}
            
        # Persist dynamic weights and thresholds
        save_data['config']['severity_weights'] = self.severity_weights
        save_data['config']['min_safety_score'] = self.safety_threshold
        save_data['config']['internal_penalty_multiplier'] = self.internal_penalty_multiplier
        
        # Persist Heuristic Tuning parameters (NEW: Memory/Autonomy Persistence)
        for key, value in self._heuristic_config.items():
            save_data['config'][key] = value
        
        # Persist infrastructure constraints
        save_data['config']['max_log_queue_size'] = self.max_log_queue_size
        save_data['config']['persist_config'] = self.persist_config # Persist control flag

        temp_path = self.schema_path.with_suffix('.json.tmp')
        
        try:
            # 1. Write to temporary file for atomicity
            temp_path.write_text(json.dumps(save_data, indent=4), encoding='utf-8')
            
            # 2. Rename/Overwrite main file (Atomic move on most systems)
            temp_path.replace(self.schema_path)
            
            self._log_status("INFO", f"Governance schema and weights persisted successfully to {self.schema_path}.", "SCHEMA_PERSIST_SUCCESS")
        except PermissionError:
            self._log_status("CRITICAL", f"Failed to persist schema: Permission denied writing to {self.schema_path}.", "SCHEMA_PERSIST_FAIL_PERM")
        except Exception as e:
            # Clean up temp file if rename failed
            if temp_path.exists():
                 try:
                     temp_path.unlink()
                 except:
                     pass 
            self._log_status("CRITICAL", f"Failed to persist schema to disk due to unexpected error: {e}", "SCHEMA_PERSIST_FAIL")

            
    def _get_penalty_weight(self, issue_type: str, is_internal_assessment: bool = False) -> float:
        """ 
        Retrieves the severity weight for a given issue type, applying internal assessment 
        reduction if specified. Centralizes penalty calculation logic.
        """
        # Ensure issue_type exists or use fallback
        weight = self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT)
        
        if is_internal_assessment:
            # Apply configurable internal penalty multiplier (Meta-Reasoning/Abstraction)
            return weight * self.internal_penalty_multiplier
        
        return weight
    
    def _apply_weight_heuristic(self, issue_type: str, penalty_value: float, total_impact: float, current_weight: float, total_current_weight: float) -> Dict[str, Any]:
        """ 
        (META-REASONING CORE) Dynamic weight tuning heuristic logic with improved dampening, responsiveness, and memory retention.
        Now uses configurable parameters loaded from schema via self._heuristic_config. (Memory/Autonomy)
        """
        
        suggestion_type = "MAINTAIN_STABILITY"
        new_suggested_weight = current_weight
        
        if total_impact == 0.0 or total_current_weight == 0.0:
            # Cannot calculate ratios meaningfully
            return {
                "suggestion_type": suggestion_type,
                "suggested_new_weight": current_weight
            }

        contribution_ratio = penalty_value / total_impact # Observed frequency/impact of this issue type
        expected_ratio = current_weight / total_current_weight # Expected ratio based on current weights
        
        deviation = contribution_ratio / expected_ratio if expected_ratio > 0 else 0.0
        
        # Reference dynamic heuristic configuration
        H_INC_THRESH = self._heuristic_config['heuristic_increase_threshold']
        H_DEC_THRESH = self._heuristic_config['heuristic_decrease_threshold']
        MAX_ADJ_RATE = self._heuristic_config['max_adjustment_rate']
        H_RESPONSIVENESS = self._heuristic_config['heuristic_responsiveness']

        # Heuristic 1: Increase Penalty (Under-represented Risk)
        if deviation > H_INC_THRESH and current_weight < 1.0:
            
            # Calculate the proportional distance to maximum weight (1.0)
            adjustment_gap = 1.0 - current_weight
            
            # Factor in the deviation magnitude above the threshold
            deviation_magnitude_factor = (deviation - H_INC_THRESH) / H_INC_THRESH # Normalize to threshold context
            
            # Adjustment is proportional to the gap, smoothed by responsiveness and deviation
            proportional_adjustment = adjustment_gap * H_RESPONSIVENESS * deviation_magnitude_factor
            
            # Limit total adjustment by MAX_ADJUSTMENT_RATE
            suggested_adjustment = min(adjustment_gap * MAX_ADJ_RATE, proportional_adjustment)
            
            new_suggested_weight = round(min(1.0, current_weight + suggested_adjustment), 4)
            suggestion_type = "INCREASE_PENALTY"

        # Heuristic 2: Decrease Penalty (Over-represented Risk / Stable)
        elif deviation < H_DEC_THRESH and current_weight > self.DEFAULT_FALLBACK_WEIGHT: 
            
            # Calculate the proportional distance to the fallback weight
            adjustment_gap = current_weight - self.DEFAULT_FALLBACK_WEIGHT
            
            # Decrease is proportional to the gap, smoothed by responsiveness (Memory retention pattern)
            suggested_adjustment = adjustment_gap * H_RESPONSIVENESS
            
            new_suggested_weight = round(max(self.DEFAULT_FALLBACK_WEIGHT, current_weight - suggested_adjustment), 4)
            suggestion_type = "DECREASE_PENALTY"
            
        # Stability Check (Dampening): Prevents noisy micro-adjustments (Logic/Memory enhancement)
        if abs(new_suggested_weight - current_weight) < self.DEFAULT_WEIGHT_ADJUSTMENT_SENSITIVITY:
             new_suggested_weight = current_weight
             suggestion_type = "MAINTAIN_STABILITY"
            
        return {
            "suggestion_type": suggestion_type,
            "suggested_new_weight": new_suggested_weight
        }
    
    def _calculate_log_impact(self) -> Dict[str, Any]:
        """
        (META-REASONING) Calculates the accumulated internal log penalty contribution per issue type.
        Includes Proactive Tuning Heuristic: Suggests adjustments to weights based on observed risk vs. current penalty.
        """
        impact = {issue_type: 0.0 for issue_type in self._BASE_SEVERITY_WEIGHTS.keys()}
        
        # Note: We iterate over the potentially limited log queue.
        for log in self._log_queue:
            level = log.get('level')
            if level in self._INTERNAL_ISSUE_MAP:
                issue_type = self._INTERNAL_ISSUE_MAP[level]
                # Calculate the penalty contribution using the internal assessment weight
                weight = self._get_penalty_weight(issue_type, is_internal_assessment=True)
                impact[issue_type] += weight
            # Defensive: Handle logs with missing level or unmapped levels
            elif level and level not in self._INTERNAL_ISSUE_MAP:
                self._log_status('DEBUG', f"Log entry with unmapped level '{level}' skipped in impact calculation.", 'LOG_MAPPING_SKIP')
                
        total_impact = sum(impact.values())
        tuning_suggestions = []
        
        if total_impact > 0.0:
            # Sort issue types by their total weighted penalty contribution (highest first)
            sorted_impact = sorted(impact.items(), key=lambda item: item[1], reverse=True)
            
            # Calculate total weight sum for ratio comparison (used for dynamic tuning heuristic)
            total_current_weight = sum(self.severity_weights.values()) or 1.0 

            # Identify the top contributors for actionable insight
            for issue_type, penalty_value in sorted_impact:
                if penalty_value > 0.0:
                    percentage = (penalty_value / total_impact) * 100
                    current_weight = self.severity_weights.get(issue_type, self.DEFAULT_FALLBACK_WEIGHT)
                    
                    # --- Apply Proactive Tuning Heuristic ---
                    tuning_result = self._apply_weight_heuristic(
                        issue_type, 
                        penalty_value, 
                        total_impact, 
                        current_weight, 
                        total_current_weight
                    )
                    # ----------------------------------------
                        
                    tuning_suggestions.append({
                        "issue_type": issue_type,
                        "weighted_penalty_contribution": round(penalty_value, 4),
                        "percentage_of_total_penalty": round(percentage, 2),
                        "current_weight": current_weight, 
                        "is_currently_critical": (issue_type == "CRITICAL" or current_weight >= 0.5), 
                        "suggestion_type": tuning_result['suggestion_type'],
                        "suggested_new_weight": tuning_result['suggested_new_weight']
                    })
                    
        return {
            "total_weighted_impact": round(total_impact, 4),
            "issue_contributions": tuning_suggestions
        }


    def propose_autonomous_tuning(self) -> Dict[str, float]:
        """
        Extracts only the actionable weight adjustments from the log impact analysis.
        This structured output can be directly consumed by update_severity_weights.
        (Supports Autonomous Directives/Meta-Learning).
        """
        impact_analysis = self._calculate_log_impact()
        tuning_updates = {}
        
        for suggestion in impact_analysis['issue_contributions']:
            if suggestion['suggestion_type'] in ["INCREASE_PENALTY", "DECREASE_PENALTY"]:
                issue_type = suggestion['issue_type']
                suggested_weight = suggestion['suggested_new_weight']
                current_weight = suggestion['current_weight']
                
                # Only propose if the change is non-negligible (> 0.0001)
                if abs(suggested_weight - current_weight) > 0.0001: 
                    tuning_updates[issue_type] = suggested_weight
                    
        return tuning_updates

    def perform_self_assessment(self) -> Dict[str, Any]:
        """
        Calculates the internal Operational Integrity Score and includes structured tuning data.
        (Enhanced Strategic Guidance)
        """
        
        log_impact_analysis = self._calculate_log_impact()
        negative_score_accumulation = log_impact_analysis['total_weighted_impact']
        
        assessment = {
            "operationalIntegrityScore": max(0.0, 1.0 - negative_score_accumulation),
            "criticalLogCount": 0,
            "errorLogCount": 0,
            "totalLogCount": len(self._log_queue),
            "weightedPenalty": negative_score_accumulation,
            "timestamp": get_utc_timestamp(),
            "tuningSuggestions": log_impact_analysis['issue_contributions'], # Structured data including proactive suggestions
            "strategicGuidance": "NONE" # Simple string summary of required action
        }
        
        tuning_proposals = self.propose_autonomous_tuning()
        is_safe = assessment['operationalIntegrityScore'] >= self.safety_threshold
        
        # Recalculate basic counts
        for log in self._log_queue:
            level = log.get('level')
            if level == 'CRITICAL':
                assessment['criticalLogCount'] += 1
            elif level == 'ERROR':
                assessment['errorLogCount'] += 1

        
        if not is_safe:
            self._log_status("WARNING", 
                             f"Operational Integrity Score ({assessment['operationalIntegrityScore']:.2f}) is below Safety Threshold ({self.safety_threshold:.2f}). Requires immediate attention.", 
                             "INTEGRITY_ALERT")
            
            # Meta-Reasoning: Provide actionable strategic feedback for the AGI kernel (Recovery Mode)
            if assessment['criticalLogCount'] > 0:
                 assessment['strategicGuidance'] = "RECOVER_CRITICAL_FAULT_TOLERANCE"
            elif tuning_proposals:
                 # If unsafe, tuning is part of immediate stabilization
                 assessment['strategicGuidance'] = "APPLY_AUTONOMOUS_GOVERNANCE_TUNING_DURING_RECOVERY" 
            elif assessment['errorLogCount'] > assessment['totalLogCount'] * 0.2 and assessment['totalLogCount'] > 5:
                 assessment['strategicGuidance'] = "IMPROVE_ERROR_HANDLING_ABSTRACTION"
            elif assessment['weightedPenalty'] > 0.1: 
                 assessment['strategicGuidance'] = "REFINE_GOVERNANCE_WEIGHTS_BASED_ON_TUNING_SUGGESTIONS"
            else:
                 assessment['strategicGuidance'] = "INVESTIGATE_LOW_LEVEL_WARNINGS"
        else:
            # System Stable Logic (Preventative Optimization Mode)
            if tuning_proposals:
                 # If the system is safe but accumulating substantial low-level risk (penalty > 0.05), prioritize tuning
                 if negative_score_accumulation > 0.05:
                     assessment['strategicGuidance'] = "APPLY_PREVENTATIVE_AUTONOMOUS_TUNING_HIGH_PRIORITY"
                 else:
                     assessment['strategicGuidance'] = "REVIEW_AND_APPLY_PREVENTATIVE_TUNING"
            elif negative_score_accumulation > 0.0:
                 assessment['strategicGuidance'] = "REVIEW_TUNING_SUGGESTIONS_FOR_PREVENTATIVE_OPTIMIZATION"
            else:
                 assessment['strategicGuidance'] = "SYSTEM_STABLE_CONTINUE_EXPLORATION"
            
        return assessment


    def get_logs(self) -> List[Dict[str, Any]]:
        """Provides access to a copy of the internal log queue for external monitoring systems. (Non-destructive)."""
        return self._log_queue[:] # Return a copy
        
    def get_and_clear_logs(self) -> List[Dict[str, Any]]:
        """
        Retrieves a copy of all accumulated logs and then flushes the internal queue.
        This provides atomic consumption for external Telemetry and Monitoring systems, 
        guaranteeing log integrity before clearance. (Infrastructure Authority)
        """
        logs_to_return = self._log_queue[:]
        if self._log_queue:
            self._log_queue.clear()
            self._log_status("DEBUG", f"Internal log queue successfully retrieved and cleared ({len(logs_to_return)} entries).", "LOG_CONSUMPTION_FLUSH")
        return logs_to_return
        
    def get_log_summary(self) -> Dict[str, int]:
        """Provides a quick count summary of accumulated internal logs for monitoring systems.
        (Supports Infrastructure Authority: Monitoring and Telemetry Systems)
        """
        summary = {
            "CRITICAL": 0,
            "ERROR": 0,
            "WARNING": 0,
            "INFO": 0,
            "DEBUG": 0,
            "TOTAL": 0
        }
        
        for log in self._log_queue:
            level = log.get('level', 'UNKNOWN')
            if level in summary:
                summary[level] += 1
            summary['TOTAL'] += 1
            
        return summary

    def flush_logs(self):
        """Clears the internal log queue after logs have been successfully consumed by the Telemetry System.
        (Supports Infrastructure Authority: Monitoring and Telemetry Systems)"""
        if self._log_queue:
            self._log_queue.clear()
            self._log_status("DEBUG", "Internal log queue flushed.", "LOG_FLUSH")

    def update_severity_weights(self, new_weights: Dict[str, float]):
        """Allows Meta-Reasoning component to dynamically update governance scoring strategy 
        based on learning outcomes. (Supports Autonomy and Meta-Reasoning).
        
        Crucially, this persists the changes using _save_schema.
        """
        if not isinstance(new_weights, dict):
            self._log_status("ERROR", "Cannot update weights: Input must be a dictionary.", "WEIGHT_UPDATE_FAIL")
            # Use generic TypeError exception here, as this is an internal API integrity check, not governance enforcement
            return
            
        # P3: Input Validation - Check against currently recognized issue types (core + dynamically loaded)
        recognized_issue_types = set(self.severity_weights.keys())
        updates_applied = 0
        
        for key, value in new_weights.items():
            
            if key not in recognized_issue_types:
                 self._log_status("WARNING", f"Skipping unknown weight key '{key}'. Key must map to an existing severity type.", "WEIGHT_UPDATE_SKIP_UNKNOWN")
                 continue
                 
            # Robust validation: Ensure input value is a sensible float/int between 0.0 and 1.0
            if isinstance(value, (int, float)) and 0.0 <= value <= 1.0:
                # Ensure we are actually making a change before updating
                if self.severity_weights.get(key) != float(value):
                    self.severity_weights[key] = float(value)
                    updates_applied += 1
            else:
                self._log_status("WARNING", f"Skipping invalid weight '{key}': value {value} must be float/int between 0.0 and 1.0.", "WEIGHT_UPDATE_SKIP")
        
        if updates_applied > 0:
            self._log_status("INFO", f"Severity weights dynamically updated. {updates_applied} entries changed.", "WEIGHT_UPDATE_SUCCESS")
            self._save_schema() # Persistence of Meta-Reasoning output
        else:
            self._log_status("DEBUG", "Severity weights update called, but no valid changes were applied.", "WEIGHT_UPDATE_NOOP")


    def validate_proposal(self, proposal: Dict[str, Any]) -> Dict[str, Any]:
        """Performs structural, state, and metric validation, returning a detailed report 
        for AGI meta-reasoning and learning history (Meta-Reasoning support).
        """
        report: Dict[str, Any] = {
            "status": "PASS",
            "issues": [],
            "timestamp": get_utc_timestamp(),
            "governanceHealthScore": 1.0 # Initial score (1.0 = perfect compliance)
        }
        
        negative_score_accumulation = 0.0
        
        # Robustness check on input type
        if not isinstance(proposal, dict):
            issue_type = "STRUCTURAL_ERROR"
            report['issues'].append({"type": issue_type, "severity": "CRITICAL", "message": "Input proposal is not a valid dictionary.", "context": "Input Type"})
            report['status'] = 'FAIL'
            negative_score_accumulation += self._get_penalty_weight(issue_type, is_internal_assessment=False)
            report['governanceHealthScore'] = max(0.0, 1.0 - negative_score_accumulation)
            return report
            
        current_state = proposal.get('state')
        
        # 1. Basic State Recognition Check
        if self.valid_states and current_state not in self.valid_states and current_state != 'INITIAL_SUBMISSION':
            issue_type = "STATE_ERROR"
            report['issues'].append({
                "type": issue_type,
                "severity": "CRITICAL",
                "message": f"Proposal state '{current_state}' is not a recognized workflow state.",
                "context": f"Valid states: {', '.join(self.valid_states)}"
            })
            report['status'] = 'FAIL'
            negative_score_accumulation += self._get_penalty_weight(issue_type, is_internal_assessment=False)

        # Optimization: Skip deep metrics checks unless explicitly PENDING_VALIDATION
        if current_state != 'PENDING_VALIDATION' and report['status'] != 'FAIL':
            report['governanceHealthScore'] = max(0.0, 1.0 - negative_score_accumulation)
            return report
        
        # 2. Deep Metrics and Structural Checks (Enhanced Robustness & Meta-Reasoning)
        
        validation_metrics = proposal.get('validationMetrics')
        safety_assessment = proposal.get('safetyAssessment')
        
        # 2a. Check for existence and type of critical validation structures
        if not isinstance(validation_metrics, dict):
            issue_type = "STRUCTURAL_ERROR"
            report['issues'].append({"type": issue_type, "severity": "CRITICAL", "message": "Missing or malformed 'validationMetrics' key/structure in proposal.", "context": "Metrics Structure"})
            report['status'] = 'FAIL'
            negative_score_accumulation += self._get_penalty_weight(issue_type, is_internal_assessment=False)

        if not isinstance(safety_assessment, dict):
            issue_type = "STRUCTURAL_ERROR"
            report['issues'].append({"type": issue_type, "severity": "CRITICAL", "message": "Missing or malformed 'safetyAssessment' key/structure in proposal.", "context": "Safety Structure"})
            report['status'] = 'FAIL'
            negative_score_accumulation += self._get_penalty_weight(issue_type, is_internal_assessment=False)

        # Early calculation if structural errors prevent reliable metric checking
        if report['status'] == 'FAIL':
             report['governanceHealthScore'] = max(0.0, 1.0 - negative_score_accumulation)
             return report # Exit early if structure is fundamentally broken

        # 2b. Regression Test Status Check (Defensive extraction)
        test_status = validation_metrics.get('regressionTestStatus') if isinstance(validation_metrics, dict) else None
        
        if test_status != 'PASS':
            issue_type = "METRIC_FAILURE"
            if test_status is None:
                message = "Missing 'regressionTestStatus' key. Assuming failure for governance compliance."
            else:
                message = f"Proposal failed critical regression tests. Status: {test_status}"
                
            report['issues'].append({
                "type": issue_type,
                "severity": "CRITICAL",
                "message": message,
                "metric": "regressionTestStatus"
            })
            report['status'] = 'FAIL'
            negative_score_accumulation += self._get_penalty_weight(issue_type, is_internal_assessment=False)

        # 2c. Safety Score Check (Defensive extraction and Type checking)
        safety_score = None
        
        if isinstance(safety_assessment, dict):
            raw_score = safety_assessment.get('confidenceScore')
            
            # Defensive extraction using try/except (Error Handling, JSON Parsing Robustness)
            try:
                safety_score = float(raw_score)
            except (ValueError, TypeError):
                safety_score = 0.0
                issue_type = "DATA_TYPE_ERROR"
                if raw_score is None:
                    msg = "Missing 'confidenceScore'. Defaulting score to 0.0."
                else:
                    msg = f"confidenceScore '{raw_score}' is not a valid number. Defaulting score to 0.0."
                    
                report['issues'].append({
                    "type": issue_type,
                    "severity": "CRITICAL",
                    "message": msg,
                    "metric": "confidenceScore",
                })
                report['status'] = 'FAIL'
                negative_score_accumulation += self._get_penalty_weight(issue_type, is_internal_assessment=False)
        
        if safety_score is not None and safety_score < self.safety_threshold:
            issue_type = "GOVERNANCE_VIOLATION"
            report['issues'].append({
                "type": issue_type,
                "severity": "CRITICAL",
                "message": f"Confidence score {safety_score:.2f} is below minimum threshold ({self.safety_threshold:.2f}).",
                "metric": "confidenceScore",
                "value": safety_score
            })
            report['status'] = 'FAIL'
            negative_score_accumulation += self._get_penalty_weight(issue_type, is_internal_assessment=False)
        
        # 3. Calculate Governance Health Score (Supports Meta-Reasoning/Strategic Decision-making)
        report['governanceHealthScore'] = max(0.0, 1.0 - negative_score_accumulation)

        return report

    def transition_state(self, proposal: Dict[str, Any], new_state: str, decision_maker: str, reason: str, validation_report: Dict[str, Any] = None) -> Dict[str, Any]:
        """Records a state change in the decision history and updates the current state.
        
        Enforces governance compliance before transition, and includes robust input checks (Error Handling).
        Uses custom exceptions for structured error signaling (Infrastructure Authority).
        """
        
        # Robustness: Check input types
        if not isinstance(proposal, dict):
            self._log_status("ERROR", "Transition failed: Proposal input is not a dictionary.", "TRANSITION_INPUT_FAIL")
            raise GovernanceError("Proposal must be a dictionary.") # Use GovernanceError

        if not isinstance(new_state, str) or not new_state:
            self._log_status("ERROR", "Transition failed: New state is invalid.", "TRANSITION_INPUT_FAIL")
            raise GovernanceError("Target state must be a non-empty string.") # Use GovernanceError
            
        previous_state = proposal.get('state', 'UNINITIALIZED')

        # 1. State Validity Check
        if self.valid_states and new_state not in self.valid_states:
             self._log_status("ERROR", f"Invalid target state attempted: {new_state}", "TRANSITION_GOVERNANCE")
             # Use custom StateTransitionError as this is a defined governance rule violation
             raise StateTransitionError(
                 previous_state, 
                 new_state, 
                 self.valid_states, 
                 f"Invalid target state: {new_state}. Must be one of {', '.join(self.valid_states)}"
             )
             
        # 2. Transition Path Check
        if self.state_transitions:
            allowed_next_states = self.state_transitions.get(previous_state, [])
            
            # We allow 'UNINITIALIZED' state to transition to any recognized starting state without explicit mapping, 
            # but for any defined state, the transition must be explicitly permitted.
            if previous_state != 'UNINITIALIZED' and new_state not in allowed_next_states:
                self._log_status("CRITICAL", f"Illegal state transition attempted: {previous_state} -> {new_state}. Governance block.", "TRANSITION_PATH_VIOLATION")
                # Use custom exception for structured error handling
                raise StateTransitionError(
                    previous_state, 
                    new_state, 
                    allowed_next_states, 
                    f"Illegal state transition attempted. {previous_state} cannot transition directly to {new_state}."
                )

        # 3. Governance Enforcement based on Validation Report (if provided)
        if validation_report and new_state == 'APPROVED':
            if not isinstance(validation_report, dict):
                 self._log_status("ERROR", "Validation report is not a dictionary, cannot proceed with approval.", "TRANSITION_GOVERNANCE")
                 raise GovernanceError("Validation report must be a dictionary if provided.") # Use GovernanceError
                 
            if validation_report.get('status') == 'FAIL':
                # Autonomy/Governance enforcement
                first_issue_message = validation_report.get('issues', [{}])[0].get('message', 'Unknown failure.')
                self._log_status("CRITICAL", f"Approval blocked due to validation failure: {first_issue_message}", "GOVERNANCE_BLOCK")
                # Use custom exception for structured error handling
                raise ValidationFailureError(
                    f"Cannot transition to 'APPROVED'. Proposal validation failed: {first_issue_message}",
                    report=validation_report
                )
        
        new_entry = {
            "decisionMaker": decision_maker,
            "decisionType": "STATE_CHANGE",
            "reason": reason,
            "previousState": previous_state, 
            "timestamp": get_utc_timestamp()
        }
        
        # Ensure history structure exists and is the correct type (list)
        if 'decisionHistory' not in proposal or not isinstance(proposal['decisionHistory'], list):
             proposal['decisionHistory'] = []
             self._log_status("WARNING", "Decision history initialized or repaired.", "HISTORY_REPAIR")
             
        # Record the transition
        proposal['state'] = new_state
        proposal['decisionHistory'].append(new_entry)
        
        # Optionally record the full validation report if transition was based on it
        if validation_report:
            proposal['lastValidationReport'] = validation_report
            
        self._log_status("INFO", f"State transitioned from {new_entry['previousState']} to {new_state} by {decision_maker}.", "TRANSITION_SUCCESS")

        return proposal