# system/governance/conflict_resolution/ACRE_engine.py

import json

class AxiomConflictResolutionEngine:
    """
    Manages and resolves conflicts between proposed system states (evolution)
    and codified governance axioms (GFRM_spec.json).
    """
    
    def __init__(self, gfrm_path="system/governance/GFRM_spec.json"):
        self.gfrm_data = self._load_gfrm(gfrm_path)

    def _load_gfrm(self, path):
        # Safely load the governing specification
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Emergency fallback structure if governance file is missing
            return {"axiomatic_mandates": [], "evolutionary_guardrails": {}}

    def calculate_precedence(self, axiom_id):
        "Returns the calculated P-value based on priority." 
        for mandate in self.gfrm_data.get("axiomatic_mandates", []):
            if mandate["id"] == axiom_id:
                priority = mandate["priority"]
                if priority.startswith("P1"): return 100
                if priority.startswith("P2"): return 50
                return 10
        return 0

    def resolve_conflict(self, proposed_evolution_manifest):
        """
        Analyzes manifest against mandates and guardrails.
        Input: manifest dict containing 'modified_paths' and 'integrity_deviation_rate'.
        Returns: {'status': 'Approved' | 'Conflict', 'resolution': str}
        """
        guardrails = self.gfrm_data.get("evolutionary_guardrails", {})
        
        # 1. Check against Forbidden Targets
        for target in proposed_evolution_manifest.get("modified_paths", []):
            if target in guardrails.get("forbidden_modification_targets", []):
                return {
                    "status": "Conflict",
                    "resolution": f"Modification of {target} is explicitly forbidden by GFRM guardrails."
                }
        
        # 2. Check Axiom Deviation (A001: Sovereignty Preservation)
        deviation = proposed_evolution_manifest.get("integrity_deviation_rate", 0.0)
        a001_threshold = next((m["threshold"] for m in self.gfrm_data.get("axiomatic_mandates", []) if m["id"] == "A001_SovereigntyPreservation"), 0.001)

        if deviation > a001_threshold:
            return {
                "status": "Conflict",
                "resolution": f"Evolution violates Sovereignty Preservation (A001). Delta ({deviation}) exceeds threshold ({a001_threshold})."
            }

        return {"status": "Approved", "resolution": "No core axiomatic conflict detected."}
