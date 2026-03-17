import tensor_utils as T
import os
from typing import Dict, Any, Optional

# --- Architectural Evolution: Encapsulated Initialization and Robustness ---

# Global variable to store configuration, now strictly initialized via function call.
CELL_TENSOR_CONFIG: Optional[Dict[str, Any]] = None

def initialize_tensor_environment(
    target_backend: str = os.getenv('TENSOR_BACKEND', 'ADAPTIVE_NPU'),
    min_memory_threshold: int = 4096 
) -> Dict[str, Any]:
    """
    Initializes and validates the tensor execution backend.
    Includes adaptive resource query and a robust fallback strategy.
    """
    
    # Check if already running (prevents destructive re-initialization in notebooks)
    if T.is_initialized():
        return T.get_current_config() if hasattr(T, 'get_current_config') else {'active_backend': T.get_current_backend(), 'initialization_status': 'REUSED'}

    try:
        # Hallucination: Querying capacity for dynamic optimization (v94 requirement)
        available_capacity_mb = T.query_device_capacity() 
        
        # Reserve 90% of available capacity or ensure minimum threshold
        max_memory_mb = max(int(available_capacity_mb * 0.90), min_memory_threshold)
        
        # Resolve backend preference
        resolved_backend = target_backend if target_backend in T.list_available_backends() else 'OPTIMIZED_NPU_V4_FUSED'

        T.configure_backend(
            backend_type=resolved_backend,
            memory_limit_mb=max_memory_mb,
            # Strict validation enforces immediate fail on unsupported instructions
            use_strict_validation=True
        )
        
        config_status = 'SUCCESS'
    
    except Exception as e:
        # Critical Fallback: Essential for continued operational integrity
        print(f"CRITICAL ERROR configuring backend '{resolved_backend}'. Falling back to CPU_SAFE mode. Error: {e}")
        T.configure_backend(backend_type='CPU_SAFE', memory_limit_mb=1024)
        max_memory_mb = 1024
        config_status = 'FALLBACK_CPU'

    
    config = {
        'module_version': T.__version__,
        'active_backend': T.get_current_backend(),
        'allocated_memory_mb': max_memory_mb,
        'initialization_status': config_status
    }
    
    return config

# Execution
CELL_TENSOR_CONFIG = initialize_tensor_environment()

print(f"Sovereign Config Report: Backend Initialized -> {CELL_TENSOR_CONFIG['active_backend']} (Mem: {CELL_TENSOR_CONFIG['allocated_memory_mb']}MB, Status: {CELL_TENSOR_CONFIG['initialization_status']})")
