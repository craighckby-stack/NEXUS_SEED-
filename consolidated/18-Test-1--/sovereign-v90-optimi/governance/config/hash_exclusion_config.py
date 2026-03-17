from typing import Dict, List

# --- Configuration for Canonicalization Exclusion ---

# Defines paths within structured payloads that should be *excluded* from 
# canonicalization and cryptographic hashing.
# Exclusion is necessary for transient fields added between processing stages 
# (e.g., timestamps, stage IDs, runtime metrics).
# Paths must be defined using dot notation (e.g., 'metadata.timestamp').

HASH_EXCLUSION_CONFIG: Dict[str, List[str]] = {
    # M-02: Manifest Payload Type (primary governance artifact)
    "M-02": [
        "system_metadata.timestamp_staged",
        "system_metadata.stage3_reviewer_id",
        "transient_runtime_id"
    ],
    # P-01: Processing Report Payload Type
    "P-01": [
        "analysis_runtime.cpu_utilization",
        "analysis_runtime.run_duration_ms",
        "analysis_runtime.execution_node_id"
    ]
}