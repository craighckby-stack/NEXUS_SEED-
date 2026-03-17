# config/policy/tre_policy_loader.py

from typing import Dict, Union
from protocols.DSP_Contract_Generator import ImpactClassification, ScopeClassification

# --- CANONICAL DEFINITION OF Triage Rules Engine (TRE) POLICY ---

# Keys map (Impact, Scope) tuples or general Impact fallbacks to required GTCM Configuration Keys.
TRE_POLICY_MAP: Dict[Union[tuple[ImpactClassification, ScopeClassification], ImpactClassification], str] = {
    # 1. Critical Core functions demand the highest fidelity (5)
    ('critical', 'core'): 'high_critical',
    
    # 2. Critical integration changes require robust verification (Fidelity 4)
    ('critical', 'integration'): 'critical_integration',
    
    # 3. High impact core changes (Fidelity 3)
    ('high', 'core'): 'medium_high',
    
    # --- General Impact Fallbacks ---
    'critical': 'medium_high', 
    'high': 'medium_high',     
    'medium': 'medium_default',
    
    # --- Low Fidelity Defaults ---
    'low': 'low_default',
    'unclassified': 'low_default'
}

# Future implementation note: This file should eventually load policies from an external
# AGI-managed configuration store (e.g., policy DB or specialized JSON/YAML), 
# allowing autonomous policy evolution without modifying code logic.
