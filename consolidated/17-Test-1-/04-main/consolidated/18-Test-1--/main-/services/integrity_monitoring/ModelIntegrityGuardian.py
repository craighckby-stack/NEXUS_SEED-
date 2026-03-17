def check_model_integrity(contract_registry, model_service_api):
    """
    Compares live model hashes against certified contracts and enforces governance policy defined in the registry.
    """
    from datetime import datetime, timedelta
    
    config = contract_registry
    policies = config['governance_policies']['validation']
    
    print(f"[Guardian] Starting integrity check against {len(config['attested_contracts'])} contracts.")
    
    for contract in config['attested_contracts']:
        contract_id = contract['contract_id']
        certified_hash = contract['certification']['hash_sha256']
        
        # Placeholder: Assume API call to running model service
        try:
            live_hash, last_validation_date = model_service_api.fetch_checksum_and_status(contract_id)
        except Exception as e:
            print(f"ERROR: Could not fetch status for {contract_id}. {e}")
            continue
            
        # 1. Cryptographic Hash Validation
        if live_hash != certified_hash:
            print(f"CRITICAL VIOLATION: Hash mismatch for {contract_id}.")
            trigger_response(policies['error_response_strategy'], contract_id, "HASH_MISMATCH")
            continue
            
        # 2. Scheduled Revalidation Check
        if datetime.now() - datetime.fromisoformat(last_validation_date) > timedelta(days=policies['frequency_days']):
            print(f"WARNING: Contract {contract_id} requires scheduled revalidation.")
            trigger_response("REQUEST_REVALIDATION", contract_id, "SCHEDULE_DUE")

def trigger_response(strategy, contract_id, violation_type):
    """Invokes the configured audit or notification protocols."""
    print(f"-> EXECUTING {strategy} for {contract_id} ({violation_type})")
    # Implement API call to L4 Security Protocol / Auditing Queue
    if strategy == "TRIGGER_L4_AUDIT_PROTOCOL":
        # system_audit_api.trigger_level4(contract_id, violation_type)
        pass
