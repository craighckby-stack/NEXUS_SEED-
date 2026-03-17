import logging
from typing import Dict, Any, List, Callable
from functools import partial

# Configure Logger
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='[GSIM Processor] %(levelname)s: %(message)s')
    logger = logging.getLogger(__name__)

# NOTE: The actual executor methods should be injected (see __init__ and scaffold proposal)

class GSIMActionProcessor:
    """
    Interprets GSIM Enforcement Maps and executes defined action chains 
    by routing actions to the appropriate System Action Executor.
    
    This class acts as the coordinator between policy configuration and execution runtime.
    """
    
    def __init__(self, enforcement_map: Dict[str, Any], executor: Any):
        """
        Initializes the processor.
        :param enforcement_map: The loaded GSIM enforcement configuration.
        :param executor: An instance conforming to the AbstractSystemActionExecutor interface.
        """
        self.map = enforcement_map.get('ENFORCEMENT_MAP', {})
        self.executor = executor
        
        # Mapping action types to concrete methods on the injected executor object
        # Uses functools.partial to bind methods to the required Action/Context signature.
        self.handlers: Dict[str, Callable[[Dict, Dict], Dict]] = {
            "ISOLATE_PROCESS": partial(self.executor.isolate_process),
            "TRIGGER_ROOT_AUDIT": partial(self.executor.trigger_root_audit),
            "NOTIFY_HUMAN": partial(self.executor.notify_human),
            "THROTTLE_QUOTA": partial(self.executor.throttle_quota),
            "REVERT_TO_LAST_GOOD_STATE": partial(self.executor.revert_state),
            "RETRY_PROCESSING": partial(self.executor.retry_processing)
            # Future actions must be added here and implemented in the concrete Executor
        }
        logger.info("GSIM Action Processor initialized with an injected Action Executor.")

    def execute_violation(self, violation_code: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Executes the defined action chain for a given violation code.
        
        :param violation_code: The GSIM identifier (e.g., 'GSIM-C-SEC-001').
        :param context: Runtime data relevant to the violation (e.g., entity IDs, logs).
        :return: A list of results from each executed action.
        """
        if violation_code not in self.map:
            logger.error(f"Execution skipped: Unknown GSIM code: {violation_code}")
            return [{"status": "ERROR", "code": violation_code, "message": "Unknown GSIM enforcement code."}]

        entry = self.map[violation_code]
        results = []
        
        logger.warning(f"[BEGIN] Enforcement chain for: {entry.get('name', violation_code)} (Severity: {entry.get('severity', 'LOW')})")

        for i, action in enumerate(entry['action_chain']):
            action_type = action.get('type')
            handler = self.handlers.get(action_type)

            if handler:
                try:
                    result = handler(action=action, context=context)
                    results.append(result)
                    logger.info(f"Action {i+1}/{len(entry['action_chain'])} ({action_type}) executed successfully.")
                except Exception as e:
                    # Critical failure during action execution requires immediate logging and halting if defined policy demands it.
                    error_message = f"Action '{action_type}' failed execution unexpectedly: {type(e).__name__}: {str(e)}"
                    logger.critical(error_message, exc_info=True)
                    results.append({
                        "status": "CRITICAL_FAILURE", 
                        "type": action_type, 
                        "reason": error_message,
                        "runtime_context": context
                    })
                    # NOTE: A robust system should define policy break points (e.g., halt chain if critical action fails)
            else:
                logger.error(f"Configuration Error: Action type '{action_type}' in map is not supported/registered.")
                results.append({"status": "CONFIG_FAIL", "type": action_type, "reason": "Handler not registered"})
        
        logger.warning(f"[END] Enforcement chain completed for {violation_code}.")
        return results