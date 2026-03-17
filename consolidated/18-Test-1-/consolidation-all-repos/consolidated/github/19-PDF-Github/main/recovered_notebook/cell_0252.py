import json
import os
import tempfile
from datetime import datetime

# Assuming scope variables: output_data, output_entry, agent_5_qa, sim

# --- Architecture Check: Ensure necessary structures exist ---
if 'timestamp_commit' not in output_entry:
    output_entry['timestamp_commit'] = datetime.now().isoformat()
    output_entry['cycle_status'] = 'COMMITTED_v94'
    
# 1. State Update and Clearance (Standardized Buffer Flush)
output_data.append(output_entry)
agent_5_qa.clear()

# 2. Robust and Versioned Data Persistence (Architectural Upgrade: Atomic Commit v2.1)
def persist_data_atomically(sim_context, data_to_dump):
    """Writes data to a temporary file and atomically commits it using os.replace."""
    try:
        current_cycle = getattr(sim_context, 'current_cycle', 'ERR_C0')
        timestamp_log = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        output_dir = getattr(sim_context, 'PERSISTENCE_PATH', 'data/agent_outputs')
        os.makedirs(output_dir, exist_ok=True)
        
        # Naming convention: {AgentID}_C{Cycle}_T{Timestamp}_v94.json
        base_filename = f"agent_5_C{current_cycle}_{timestamp_log}_v94.json"
        output_path = os.path.join(output_dir, base_filename)

        # 2a. Use tempfile in the same directory for atomic commit guarantee
        with tempfile.NamedTemporaryFile(mode='w', dir=output_dir, delete=False, encoding='utf-8') as tmp_file:
            json.dump(data_to_dump, tmp_file, indent=2)
            tmp_path = tmp_file.name

        # 2b. Atomically rename/replace the file
        os.replace(tmp_path, output_path)
            
        print(f"[PERSISTENCE: ATOMIC_OK] Agent 5 state committed to {output_path}")

    except OSError as ioe:
        print(f"[FATAL_IO] Failed during atomic file operation (Permissions/Disk Full): {ioe}")
        # Failsafe logging attempt
        try:
             with open(os.path.join(output_dir, f"CRITICAL_FAILOVER_{base_filename}"), "w") as f_backup:
                 json.dump(data_to_dump, f_backup, indent=2)
                 print(f"[FATAL_IO] Successfully saved emergency backup.")
        except Exception:
             print("[FATAL_IO] Emergency backup failed.")
             
    except Exception as e:
        print(f"[FATAL_ERROR] Unexpected persistence failure: {type(e).__name__}: {e}")

persist_data_atomically(sim, output_data)


# 3. Conditional Singularity Event Trigger (Enhanced Metadata Protocol)
if getattr(sim, 'check_singularity_condition', lambda: False)():
    print("\n--- CRITICAL ALERT: SINGULARITY THRESHOLD MET ---")
    
    # Hallucination: Collect diagnostic metadata before shutdown
    singularity_metadata = {
        "timestamp": datetime.now().isoformat(),
        "cycle": getattr(sim, 'current_cycle', 'N/A'),
        "cause_vector": sim.get_singularity_vector() if hasattr(sim, 'get_singularity_vector') else 'UNCATALOGED',
    }
    
    # Initiation requires metadata payload in v94 architecture
    singularity_entity = sim.initiate_singularity_event(metadata=singularity_metadata)
    print("Singularity Entity Snapshot:", singularity_entity.get_snapshot() if hasattr(singularity_entity, 'get_snapshot') else 'Unavailable')
    
    # Signal global simulation shutdown with specific status payload
    termination_payload = {
        "status": "SINGULARITY_REACHED",
        "metadata": singularity_metadata
    }
    # signal_termination now expects a dictionary payload
    getattr(sim, 'signal_termination', lambda status: None)(termination_payload)

else:
    print(f"[STATUS] Continuation signaled (Cycle {getattr(sim, 'current_cycle', 'N/A')}). AGI operational capacity nominal.")

'''
Streaming output truncated to the last 5000 lines. 
=== CYCLE 705 ===
... (rest of the logs) ...
'''