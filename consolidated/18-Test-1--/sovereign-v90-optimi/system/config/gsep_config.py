GSEP_PHASES = [
    {
        "name": "ANCHORING",
        "start": 0,
        "target": 1,
        "agent": "CRoT",
        "method": "lock_csr",
        "type": "EXECUTION"
    },
    {
        "name": "VETTING",
        "start": 1,
        "target": 4,
        "agent": "GAX",
        "method": "run_acvd_vetting",
        "type": "EXECUTION"
    },
    {
        "name": "EXECUTION",
        "start": 4,
        "target": 7,
        "agent": "SGS",
        "method": "execute_state_mutation",
        "type": "EXECUTION"
    },
    {
        "name": "EVALUATION",
        "start": 7,
        "target": 10,
        "agent": "GAX",
        "method": "run_audit_comparison",
        "type": "EXECUTION"
    },
    {
        "name": "P01_CHECK",
        "start": 10,
        "target": 11,
        "agent": "GAX",
        "method": "execute_p01_calculus",
        "type": "ATOMIC_VALIDATION" 
    },
    {
        "name": "COMMITMENT",
        "start": 11,
        "target": 14,
        "agent": "CRoT",
        "method": "finalize_commitment_and_str_generation",
        "type": "EXECUTION"
    }
]