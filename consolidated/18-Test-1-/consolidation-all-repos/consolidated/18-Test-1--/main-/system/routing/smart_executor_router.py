class SmartExecutorRouter:
    """Manages dynamic routing, health checking, and load balancing across executors based on registry configurations."""

    def __init__(self, config_path="config/executor_registry.json"):
        import json
        with open(config_path, 'r') as f:
            self.registry = json.load(f)

    def select_executor(self, required_capabilities: list, required_tier="P1_CRITICAL", strategy="load_optimized"):
        candidates = []
        
        # 1. Filter based on capability match and current status/tier
        for executor_id, executor_data in self.registry.items():
            is_ready = executor_data['status'] == 'READY'
            is_required_tier = executor_data['priority_tier'] == required_tier
            
            # Flatten capabilities for checking
            all_capabilities = executor_data['capabilities']['data_processing'] + executor_data['capabilities']['system_tags']
            
            if all(cap in all_capabilities for cap in required_capabilities) and is_ready and is_required_tier:
                candidates.append((executor_id, executor_data))

        if not candidates:
            # Fallback logic (e.g., try P2 tier or degraded status)
            return None, "No healthy executor found for required capabilities."

        # 2. Apply optimization strategy
        if strategy == "load_optimized":
            best_candidate = min(candidates, key=lambda x: x[1]['metrics']['load_average'])
        elif strategy == "cost_optimized":
            best_candidate = min(candidates, key=lambda x: x[1]['metrics']['cost_per_query_usd'])
        else:
             # Default: lowest latency
            best_candidate = min(candidates, key=lambda x: x[1]['metrics']['latency_p95_ms'])

        return best_candidate[0], best_candidate[1]['endpoint']

# Note: This file requires monitoring/health-check background workers to update the 'status' and 'metrics' fields in the configuration dynamically.