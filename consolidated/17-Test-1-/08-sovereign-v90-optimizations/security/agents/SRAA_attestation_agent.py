# Secure Remote Attestation Agent (SRAA)
# Runs in TEE/Secure Enclave. Only active upon SIVM failure signals.

import os
import json
import TEE_interface
import crypto_utils

ATTESTATION_ENDPOINT = TEE_interface.get_endpoint("SIVM_EKEY_1")

def run_attestation(failure_state_data):
    """Collects minimal forensic snapshot and securely transmits it out-of-band."""
    if not TEE_interface.is_secure_state():
        return False

    # 1. Collect immutable evidence (e.g., register dumps, memory hash)
    evidence = TEE_interface.collect_sealed_evidence()
    
    # 2. Package failure context
    package = {
        "timestamp": TEE_interface.get_secure_time(),
        "module_id": "SIVM_V2",
        "failure_data": failure_state_data,
        "immutable_evidence": evidence
    }
    
    # 3. Encrypt package using predefined key/protocol (AES-256-GCM)
    encrypted_package = crypto_utils.encrypt_data(json.dumps(package), ATTESTATION_ENDPOINT['key'])
    
    # 4. Transmit securely
    success = TEE_interface.transmit_securely(ATTESTATION_ENDPOINT['url'], encrypted_package)
    
    return success

# SRAA_AGENT is now included in SEALED_STATE allowed_components.