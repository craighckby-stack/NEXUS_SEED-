class ActionDispatcher:
    """Service responsible for resolving and executing configured governance actions."""

    def __init__(self, config_store):
        self.actions_map = config_store.get('governance_actions_map')

    def dispatch(self, action_id, breach_context, dynamic_params=None):
        if action_id not in self.actions_map:
            raise ValueError(f"Unknown action ID: {action_id}")

        action_def = self.actions_map[action_id]
        handler = action_def['action_handler']
        base_params = action_def['parameters_template']

        # 1. Merge default params with context-specific overrides
        payload = self._merge_parameters(base_params, breach_context, dynamic_params)

        # 2. Lookup and execute the specific handler (e.g., call ScalingEngine API)
        success = self._execute_handler(handler, payload)
        
        return success

    def _merge_parameters(self, base, context, dynamic):
        # Logic for injecting context (e.g., breaching DIM_KEY, value) into the payload.
        merged = base.copy()
        merged.update({"context": context})
        if dynamic: merged.update(dynamic)
        return merged

    def _execute_handler(self, handler, payload):
        # Implement API client invocation logic (e.g., HTTP POST to scaling engine)
        print(f"Executing {handler} with payload: {payload}")
        return True
