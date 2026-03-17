import json
import hashlib
import os

class ACVMGenerator:
    """Utility for generating and validating ACVM configurations and their structural integrity hashes."""

    def __init__(self, config_path="config/acvm.json", authority_source="ACVD"):
        self.config_path = config_path
        self.authority_source = authority_source

    def calculate_integrity_hash(self, data: dict) -> str:
        """Calculates a canonical SHA256 hash of the configuration structure, excluding the hash field itself."""
        # Ensure the dictionary is sorted by keys to guarantee a stable hash output
        canonical_json = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return "sha256:" + hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()

    def generate_and_update(self):
        """Reads the ACVM, calculates the definitive hash, and updates the integrity constraint."""
        with open(self.config_path, 'r') as f:
            config = json.load(f)
        
        # Isolate the section for hashing (excluding dynamic metadata like the hash itself)
        integrity_key = 'policy_integrity'
        if integrity_key in config['constraints']:
            # Temporarily remove the existing hash value for accurate calculation
            current_hash = config['constraints'][integrity_key]['definition']['parameters'].pop('active_policy_hash', None)
            
            # Calculate hash of the current *effective* structure
            new_hash = self.calculate_integrity_hash(config)
            
            # Restore the parameters with the new hash
            config['constraints'][integrity_key]['definition']['parameters']['active_policy_hash'] = new_hash
            config['constraints'][integrity_key]['definition']['parameters']['source_authority'] = self.authority_source

        # Write the updated configuration back
        with open(self.config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"[ACVM] Configuration updated. New hash: {new_hash}")
        return new_hash

if __name__ == '__main__':
    # Example usage during deployment preparation
    generator = ACVMGenerator()
    # Note: Requires the config/acvm.json file to be present
    # generator.generate_and_update()
    print("ACVM Generator utility ready.")