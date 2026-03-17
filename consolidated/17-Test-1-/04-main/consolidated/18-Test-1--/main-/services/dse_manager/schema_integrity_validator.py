import json
import hashlib
import os

MANIFEST_PATH = 'config/dse_schema_manifest.json'

def calculate_checksum(file_path):
    """Calculates SHA256 checksum for a given file."""
    hasher = hashlib.sha256()
    try:
        with open(file_path, 'rb') as f:
            while chunk := f.read(4096):
                hasher.update(chunk)
        return 'sha256:' + hasher.hexdigest()
    except FileNotFoundError:
        return None

def validate_and_plan_migrations():
    """Validates schema integrity and generates migration plan based on manifest."""
    print(f"[DSE] Loading manifest from {MANIFEST_PATH}")
    
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)

    integrity_ok = True
    migration_plan = {'required': [], 'warnings': []}

    for schema in manifest.get('schemas', []):
        name = schema['name']
        expected_checksum = schema['checksum']
        file_path = schema['path']
        strategy = schema['evolution_strategy']
        status = schema['status']

        # 1. Integrity Check
        actual_checksum = calculate_checksum(file_path)
        if not actual_checksum:
            print(f"[ERROR] Schema {name}: File not found at {file_path}.")
            integrity_ok = False
            continue
        
        if actual_checksum != expected_checksum:
            print(f"[CRITICAL] Schema {name}: Checksum mismatch. Expected {expected_checksum}, Found {actual_checksum}.")
            integrity_ok = False
        else:
            print(f"[OK] Schema {name}: Integrity verified.")

        # 2. Migration Planning
        if status == 'Deprecated' or 'migration' in strategy:
            migration_plan['required'].append({
                'schema': name,
                'strategy': strategy,
                'path': file_path
            })
        elif strategy == 'requires_atomic_swap':
             migration_plan['warnings'].append(f"Schema {name} requires specialized deployment tooling (Atomic Swap).")

    if integrity_ok:
        print("\n[SUCCESS] All schema file checksums verified.")
    
    print("\n[MIGRATION PLAN]")
    print(json.dumps(migration_plan, indent=2))
    return integrity_ok, migration_plan

if __name__ == '__main__':
    validate_and_plan_migrations()