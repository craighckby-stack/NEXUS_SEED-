# protocols/DSP_Contract_Generator.py

import json
from typing import Dict, Any, Literal, TypedDict, Union

# --- Standardized Type Definitions for System Clarity ---

FidelityLevel = Literal[1, 2, 3, 4, 5]
ScopeClassification = Literal['core', 'peripheral', 'minor', 'integration']
ImpactClassification = Literal['critical', 'high', 'medium', 'low', 'unclassified']

class MISPayloadMetadata(TypedDict):
    scope: ScopeClassification
    impact_classification: ImpactClassification

class MISPayload(TypedDict):
    id: str
    metadata: MISPayloadMetadata

class BudgetConstraints(TypedDict):
    duration_seconds: int
    cpu_allocation: float
    memory_gb: float

class GTCMConfig(TypedDict):
    simulation_fidelity_map: Dict[str, FidelityLevel]
    resource_budgets: Dict[str, BudgetConstraints]

class DSPContract(TypedDict):
    contract_version: str
    mandate_id: str
    required_fidelity_level: FidelityLevel
    sem_constraints: BudgetConstraints
    required_outputs: list[str]

# --- Protocol Constants & Triage Policy Definition ---

DEFAULT_BUDGET: BudgetConstraints = {
    'duration_seconds': 60,
    'cpu_allocation': 0.5,
    'memory_gb': 4.0
}

# Triage Rules Engine (TRE) Policy Mapping: (Impact, Scope) -> Configuration Key
# NOTE: This definition will be externalized via a proposed scaffold for policy separation.
TRE_POLICY_MAP: Dict[Union[tuple[ImpactClassification, ScopeClassification], ImpactClassification], str] = {
    # 1. Specific Direct Mappings (Priority Triage)
    ('critical', 'core'): 'high_critical',
    ('critical', 'integration'): 'critical_integration',
    ('high', 'core'): 'medium_high', 
    
    # 2. General Impact Fallbacks (Severity Triage)
    'critical': 'medium_high', 
    'high': 'medium_high',     
    'medium': 'medium_default',
    
    # 3. Default Catch-all
    'low': 'low_default',
    'unclassified': 'low_default'
}

class DSPContractGenerator:
    """
    Encapsulates the Triage and Contract Generation Process (DSP-C).
    Utilizes the defined TRE_POLICY_MAP to map Mission Impact Statements (MIS)
    to specific GTCM-defined Fidelity Levels and Resource Budgets.
    """
    CONTRACT_VERSION = "3.0" 

    def __init__(self, gtcm_config: GTCMConfig):
        """
        Initializes the generator with the current Global Tactical Configuration Management (GTCM) data.
        """
        self.gtcm_config = gtcm_config
        self.fidelity_map = self.gtcm_config.get('simulation_fidelity_map', {})
        self.resource_budgets = self.gtcm_config.get('resource_budgets', {})

    def _triage_fidelity_key(self, impact: ImpactClassification, scope: ScopeClassification) -> str:
        """
        Implements the Triage Rules Engine (TRE) logic to derive the required configuration key.
        """
        
        # 1. Check for specific Impact/Scope pairing
        pair_key = (impact, scope)
        if pair_key in TRE_POLICY_MAP:
            return TRE_POLICY_MAP[pair_key]
            
        # 2. Check for general Impact fallback
        if impact in TRE_POLICY_MAP:
            return TRE_POLICY_MAP[impact]
        
        # 3. Default Catch-all 
        return 'low_default'

    def generate_contract(self, mis_payload: MISPayload) -> DSPContract:
        """
        Analyzes the MIS payload against internal configuration to generate a DSP Contract.
        """
        
        metadata = mis_payload.get('metadata')
        if not metadata:
             change_scope: ScopeClassification = 'minor'
             impact_vector: ImpactClassification = 'unclassified'
        else:
            change_scope: ScopeClassification = metadata.get('scope', 'minor')
            impact_vector: ImpactClassification = metadata.get('impact_classification', 'unclassified')

        # 1. Complexity Assessment & Key Derivation (TRE)
        fidelity_key = self._triage_fidelity_key(impact_vector, change_scope)

        # 2. Derive Fidelity Level 
        # Defaults to Level 1 if key is misconfigured in GTCM
        fidelity_level: FidelityLevel = self.fidelity_map.get(fidelity_key, 1)

        # 3. Resource and Time Budget Lookup
        budget_key = str(fidelity_level)
        budget_config: BudgetConstraints = self.resource_budgets.get(budget_key, DEFAULT_BUDGET)
        
        dsp_contract: DSPContract = {
            "contract_version": self.CONTRACT_VERSION, 
            "mandate_id": mis_payload.get('id', f"GEN-{self.CONTRACT_VERSION}-N/A"),
            "required_fidelity_level": fidelity_level,
            "sem_constraints": budget_config,
            "required_outputs": ["Verification_Log", "Certification_Artifacts", "Resource_Allocation_Manifest"] 
        }
        
        return dsp_contract

# --- Utility Function Wrapper (For backwards compatibility) ---
def generate_dsp_contract(mis_payload: MISPayload, gtcm_config: GTCMConfig) -> DSPContract:
    """Wrapper for simplified stateless use, internally utilizes the DSPContractGenerator class."""
    generator = DSPContractGenerator(gtcm_config)
    return generator.generate_contract(mis_payload)

if __name__ == '__main__':
    
    TEST_GTCM_CONFIG: GTCMConfig = {
        "simulation_fidelity_map": {
            "high_critical": 5,
            "critical_integration": 4,
            "medium_high": 3,
            "medium_default": 2,
            "low_default": 1
        },
        "resource_budgets": {
            "5": {'duration_seconds': 300, 'cpu_allocation': 8.0, 'memory_gb': 64.0},
            "4": {'duration_seconds': 180, 'cpu_allocation': 4.0, 'memory_gb': 32.0},
            "3": {'duration_seconds': 120, 'cpu_allocation': 2.0, 'memory_gb': 16.0},
            "2": {'duration_seconds': 60, 'cpu_allocation': 1.0, 'memory_gb': 8.0},
            "1": DEFAULT_BUDGET
        }
    }
    
    generator = DSPContractGenerator(TEST_GTCM_CONFIG)
    
    mis_core_critical: MISPayload = {
        'id': 'MND-C001',
        'metadata': {
            'scope': 'core',
            'impact_classification': 'critical'
        }
    }

    contract = generator.generate_contract(mis_core_critical)
    print(f"Contract V{DSPContractGenerator.CONTRACT_VERSION} (Core/Critical):")
    print(json.dumps(contract, indent=4))
