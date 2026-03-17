class SPDM_IntegrityValidator:
    def __init__(self, config_path):
        self.config = self._load_config(config_path)

    def _load_config(self, path):
        # Implementation for reading and parsing the SPDM JSON file
        pass

    def verify_constraints(self):
        """Validates that all defined values adhere to min/max constraints."""
        for key, definition in self.config['definitions'].items():
            value = definition['value']
            constraints = definition['constraints']
            if value < constraints['min'] or value > constraints['max']:
                raise ValueError(f"SPDM Constraint Violation: {key} value ({value}) is outside [{constraints['min']}, {constraints['max']}]")
        return True

    def verify_attestation(self, expected_signature):
        """Verifies the cryptographic integrity signature."""
        current_signature = self.config['attestations'].get('manifest_signature')
        if current_signature == '[V95_GLOBAL_ATTESTATION_HASH]':
            # Placeholder check, actual crypto verification logic required here.
            print("Warning: SPDM using placeholder hash. Requires live certification check.")
            return False # Fail strict validation if placeholder is present.
        return current_signature == expected_signature

    def run_full_validation(self, expected_signature):
        self.verify_constraints()
        if not self.verify_attestation(expected_signature):
            raise PermissionError("SPDM Attestation Failure: Manifest integrity compromised or unauthorized version.")
        return True