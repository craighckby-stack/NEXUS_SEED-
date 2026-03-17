import logging
from typing import Dict, Any, List, Callable
from functools import partial

# Configure Logger
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='[GSIM Processor] %(levelname)s: %(message)s')
    logger = logging.getLogger(__name__)

class GSIMActionProcessor:
    """
    Interprets GSIM Enforcement Maps and executes defined action chains 
    by routing actions to the appropriate System Action Executor.
    
    This class acts as the coordinator between policy configuration and execution runtime.
    """

    # Define the recursive mapping abstraction layer statically.
    # KEY: GSIM Action Type (used in enforcement map)
    # VALUE: Expected Executor method name (snake_case)
    ACTION_MAP_DEFINITION = {
        "ISOLATE_PROCESS": "isolate_process",
        "TRIGGER_ROOT_AUDIT": "trigger_root_audit",
        "NOTIFY_HUMAN": "notify_human",
        "THROTTLE_QUOTA": "throttle_quota",
        "REVERT_TO_LAST_GOOD_STATE": "revert_state",
        "RETRY_PROCESSING": "retry_processing",
    }

    def __init__(self, enforcement_map: Dict[str, Any], executor: Any):
        self.map = enforcement_map.get('ENFORCEMENT_MAP', {})
        self.executor = executor
        # Dynamically build handlers during initialization for O(1) lookup during execution
        self.handlers: Dict[str, Callable] = self._bind_executor_handlers()
        logger.info("GSIM Action Processor initialized with dynamically bound handlers (Abstraction Level 1).")

    def _bind_executor_handlers(self) -> Dict[str, Callable]:
        """
        Recursively binds GSIM action types to specific methods 
        on the injected executor, using getattr and partial for efficient
        method resolution and binding overhead reduction at runtime.
        """
        handlers = {}
        for action_type, method_name in self.ACTION_MAP_DEFINITION.items():
            try:
                # Efficient runtime lookup of the method reference
                executor_method = getattr(self.executor, method_name)
                
                # Use partial to create a highly efficient, pre-bound callable reference
                # This eliminates method resolution overhead during the tight execution loop.
                handlers[action_type] = partial(executor_method)
                
            except AttributeError:
                logger.critical(f"Executor contract violation: Required method '{method_name}' for action '{action_type}' is missing.")
                # Skip registering handlers for missing methods.
        
        return handlers

    def execute_violation(self, violation_code: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Executes the defined action chain for a given violation code.
        """
        if violation_code not in self.map:
            # Use format string optimization for logging
            logger.error("Execution skipped: Unknown GSIM code: %s", violation_code)
            return [{"status": "ERROR", "code": violation_code, "message": "Unknown GSIM enforcement code."}]

        entry = self.map[violation_code]
        action_chain = entry.get('action_chain', [])
        results = []
        
        # Pre-calculate length of the chain
        total_actions = len(action_chain)
        
        logger.warning("[BEGIN] Enforcement chain for: %s (Severity: %s)", 
                       entry.get('name', violation_code), entry.get('severity', 'LOW'))

        for i, action in enumerate(action_chain):
            action_type = action.get('type')
            handler = self.handlers.get(action_type)

            # O(1) Handler existence check
            if handler is None:
                logger.error("Configuration Error: Action type '%s' in map is not supported/registered.", action_type)
                results.append({"status": "CONFIG_FAIL", "type": action_type, "reason": "Handler not registered"})
                continue
            
            # --- Core Recursive Execution Unit Invocation ---
            try:
                # Invocation of the partial function handler is highly efficient.
                result = handler(action=action, context=context)
                results.append(result)
                
                # Optimized logging format
                logger.info("Action %d/%d (%s) executed successfully.", 
                            i + 1, total_actions, action_type)
                            
            except Exception as e:
                error_name = type(e).__name__
                error_message = f"Action '{action_type}' failed execution unexpectedly: {error_name}: {str(e)}"
                logger.critical(error_message, exc_info=True)
                results.append({
                    "status": "CRITICAL_FAILURE", 
                    "type": action_type, 
                    "reason": error_message,
                    "runtime_context": context
                })
        
        logger.warning("[END] Enforcement chain completed for %s.", violation_code)
        return results