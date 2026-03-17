class PolicyEnforcementService:
    """Validates governance specifications (smc_specification.json) before allowing state mutation or command execution."""

    def __init__(self, spec_config: dict):
        self.spec = spec_config
        self.states = self.spec['states']
        self.transitions = self.spec['transitions']

    def check_transition_validity(self, current_state: str, next_state: str, required_auth_signature: dict) -> bool:
        """Validates transition existence, pre-conditions, and authorization."""
        
        # 1. Find the authoritative transition definition
        found_transition = None
        for t in self.transitions:
            # Handle '*' wildcard for 'from'
            from_states = t['from'] if isinstance(t['from'], list) else [t['from']]
            if (current_state in from_states or '*' in from_states) and t['to'] == next_state:
                found_transition = t
                break
        
        if not found_transition:
            print(f"Error: Transition {current_state} -> {next_state} is not authorized.")
            return False

        # 2. Check pre-conditions (e.g., system checks, votes)
        if 'pre_conditions' in found_transition:
            for condition in found_transition['pre_conditions']:
                if not self._verify_prerequisite(condition):
                    print(f"Error: Failed mandatory pre-condition: {condition}")
                    return False

        # 3. Check authorization
        if found_transition.get('auth_required', True):
            if not self._check_governance_authorization(found_transition, required_auth_signature):
                print("Error: Transition failed authorization check.")
                return False

        return True

    def _verify_prerequisite(self, condition: str) -> bool:
        # Placeholder logic: Requires integration with system health monitors and governance systems.
        # E.g., self.system_monitor.get_status(condition)
        return True 

    def check_command_permission(self, current_state: str, command: str, roles: list) -> bool:
        cmd_spec = self.spec['commands'].get(command)
        if not cmd_spec: return False

        # Check minimum state requirement
        min_state = cmd_spec.get('min_state')
        if min_state and self.states[current_state]['trust_level'] < self.states[min_state]['trust_level']:
            print(f"Error: Command {command} restricted. Current state {current_state} is below required level {min_state}.")
            return False
            
        # Check role permission
        if 'ANY' in cmd_spec['roles']: return True
        if any(role in cmd_spec['roles'] for role in roles): return True

        return False

    def _check_governance_authorization(self, transition: dict, signature: dict) -> bool:
        # Placeholder implementation for auth check (MultiSig logic would be here)
        return True

