import logging
from typing import Dict, Any, Callable, TypedDict, List
from system.monitoring.IH_Sentinel import IHSentinel
from system.utility.RRP_manager import RRPManager
from system.config.gsep_config import GSEP_PHASES
from system.exceptions.GSEP_exceptions import GSEPIntegrityBreach, GSEPConfigurationError, GSEPValidationFailure

# NOTE: Assume necessary agent interfaces and FSL instances are injected.

# Define structure for clarity and improved type safety
class GSEPPhase(TypedDict):
    target: int
    agent: str
    method: str
    type: str

class GSEPOrchestrator:
    """Manages the mandatory, linear 15-stage Governance State Execution Pipeline (GSEP-C)."""
    
    def __init__(self, agent_interfaces: Dict[str, Any], state_manager: Any, flag_state_log: Any):
        self.agents = agent_interfaces 
        self.state = state_manager
        self.fsl = flag_state_log
        # IHSentinel retained for compatibility, but injection is preferred for V95.
        self.ih_sentinel = IHSentinel()
        # S00 is the initial state before execution starts.
        self.current_stage = 0 
        self.phase_configs: List[GSEPPhase] = self._load_and_validate_phases(GSEP_PHASES)

    def _load_and_validate_phases(self, phases: List[Dict]) -> List[GSEPPhase]:
        """Placeholder to integrate with dedicated phase validator utility."""
        # Once system/utility/GSEP_phase_validator is scaffolded, this should call it.
        required_keys = ['target', 'agent', 'method', 'type']
        for i, phase in enumerate(phases):
            if not all(key in phase for key in required_keys):
                 raise GSEPConfigurationError(f"Phase {i} missing required keys. Must define: {required_keys}")
        return phases
        
    def _handle_integrity_halt(self, exception: Exception) -> bool:
        """Centralized function for handling GSEP failures, logging, IH trigger, and state restoration.
           Accepts Exception object for enhanced logging of failure type."""
        failure_reason = str(exception)
        fail_label = f"S{self.current_stage:02d}"

        logging.critical(f"GSEP Integrity Halt initiated at {fail_label}. Reason: {failure_reason} (Type: {type(exception).__name__})")

        # Activation protocols
        self.ih_sentinel.trigger_ih(fail_label, failure_reason)
        RRPManager.restore_state(self.state) 
        
        return False

    def _progress_to_stage(self, target_stage: int) -> str:
        """
        Linearly increments the current stage to the target stage.
        Checks FSL integrity *during* every intermediate step.
        Returns the stage label (e.g., 'S05').
        """
        if target_stage <= self.current_stage:
            raise GSEPConfigurationError(f"Phase target {target_stage} must be greater than current stage {self.current_stage}.")

        while self.current_stage < target_stage:
            self.current_stage += 1
            stage_label = f"S{self.current_stage:02d}"
            
            # Critical Check 1: FSL violation between stages
            if self.fsl.check_for_flags():
                raise GSEPIntegrityBreach(f"IH Flag detected during Stage transition to {stage_label}.")
            
            logging.debug(f"Stage {stage_label} reached. Ready for execution.")
            
        return f"S{self.current_stage:02d}"

    def _get_agent_method(self, agent_key: str, method_name: str) -> Callable[..., Any]:
        """Utility to retrieve agent method or raise configuration errors. Checks for existence and callability."""
        agent = self.agents.get(agent_key)
        if not agent:
             raise GSEPConfigurationError(f"Missing required Agent interface: {agent_key}")

        task_method = getattr(agent, method_name, None)
        if task_method is None or not callable(task_method):
            raise GSEPConfigurationError(f"Agent '{agent_key}' missing required or callable method: {method_name}")
        
        return task_method

    def _validate_execution_result(self, phase: GSEPPhase, result: Any, stage_label: str):
        """Perform phase-specific validation on the execution result, including mandatory FSL check."""
        phase_type = phase['type']
        method_name = phase['method']
        
        # Specific validation check (P-01 Axiomatic Calculus only)
        if phase_type == 'ATOMIC_VALIDATION':
            if not isinstance(result, bool) or not result:
                raise GSEPValidationFailure(f"{stage_label} P-01 FAIL: Axiomatic breach identified during calculus.")
        
        # Critical Check 2: Post-execution integrity check (FSL)
        if self.fsl.check_for_flags():
             raise GSEPIntegrityBreach(f"Post-execution IH Flag detected at {stage_label} after {method_name}.")


    def _run_gsep_phase(self, phase: GSEPPhase):
        """Executes a single GSEP phase, enforcing progression, execution, and integrity checks."""
        
        # 1. Progression Enforcement (includes inter-stage integrity check)
        stage_label = self._progress_to_stage(phase['target'])
        
        # 2. Setup & Configuration Check
        task_method = self._get_agent_method(phase['agent'], phase['method'])

        logging.info(f"{stage_label} ({phase['type']}): Executing {phase['agent']}.{phase['method']}")

        # 3. Execution
        result = task_method()

        # 4. Validation and Integrity Check
        self._validate_execution_result(phase, result, stage_label)

    def enforce_pipeline(self) -> bool:
        """Runs the entire GSEP sequence."""
        logging.info("S00: GSEP Initialization. State anchoring starts.")

        try:
            # Use pre-validated phases loaded in __init__
            for phase in self.phase_configs:
                self._run_gsep_phase(phase)

            # S15 represents final commit state after S14 execution
            self.current_stage = 15 
            logging.info("S15: GSEP Complete. STR generated. State Committed.")
            return True

        except (GSEPIntegrityBreach, GSEPConfigurationError, GSEPValidationFailure) as e:
            # Route specific anticipated GSEP failures.
            return self._handle_integrity_halt(e)
            
        except Exception as e:
            # Catch all other unexpected runtime exceptions.
            return self._handle_integrity_halt(e)