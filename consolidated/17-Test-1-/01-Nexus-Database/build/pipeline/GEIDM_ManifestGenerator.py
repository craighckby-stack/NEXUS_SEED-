#!/usr/bin/env python3
# A critical utility to automate the integrity stamping process during CI/CD.
import json
import hashlib
import os
import subprocess

MANIFEST_PATH = 'config/GACR/GEIDM_SchemaIntegrityManifest.json'
SCHEMA_ROOT = 'schemas'

def get_git_commit():
    try:
        return subprocess.check_output(['git', 'rev-parse', 'HEAD']).strip().decode('utf-8')
    except Exception: 
        return 'UNKNOWN_COMMIT'

def compute_hash(file_path):
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def generate_manifest():
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)
    
    current_commit = get_git_commit()

    for definition in manifest['schemaDefinitions']:
        relative_path = definition['relativePath']
        # Assuming relativePath is consistent with file system location
        schema_path = relative_path.lstrip('/')

        if os.path.exists(schema_path):
            checksum = compute_hash(schema_path)
            definition['integrityCheck']['hash'] = checksum
            definition['integrityCheck']['lastValidatedGitCommit'] = current_commit
        else:
            print(f"Warning: Schema file not found: {schema_path}")
            definition['integrityCheck']['hash'] = 'FILE_NOT_FOUND'
            
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Successfully updated {MANIFEST_PATH}. Linked to commit: {current_commit}")

if __name__ == '__main__':
    generate_manifest()
