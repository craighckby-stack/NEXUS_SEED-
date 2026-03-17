from typing import Dict, Any, List

class GSEP_ConfigModel:
    """
    Centralized model for defining the canonical structure and metadata of the 
    Governance and Stage Evolution Protocol (GSEP) phases (L0 to L6). 

    In a future iteration, GSEPStageResolver should import the sequence and phase 
    names from this configuration source.
    """

    # Defines canonical order and process name for each lock, along with metadata
    CANONICAL_SEQUENCE: Dict[str, Dict[str, Any]] = {
        'L0': {
            'phase_name': 'INITIATION',
            'description': 'Initial scoping and artifact definition.',
            'required_inputs': ['proposal_vN.md', 'objective_spec.json'],
            'subprocess_target': 'MandateSynthesizer'
        },
        'L1': {
            'phase_name': 'VET_LOCK_A',
            'description': 'First-pass security, dependency, and logical validity check.',
            'max_runtime_sec': 300,
            'subprocess_target': 'VetoEngine_L1'
        },
        'L2': {
            'phase_name': 'VET_LOCK_B',
            'description': 'Deep external audit verification and resource allocation review.',
            'max_runtime_sec': 600,
            'subprocess_target': 'VetoEngine_L2'
        },
        'L3': {
            'phase_name': 'PROOF',
            'description': 'Generation of formal correctness proof artifacts.',
            'required_assets': ['formal_proof.zkp', 'simulation_output.json'],
            'subprocess_target': 'ProofGenerator'
        },
        'L4': {
            'phase_name': 'ADJUDICATION',
            'description': 'Final governance review and resource commitment arbitration.',
            'required_quorum': 3,
            'subprocess_target': 'Arbitrator'
        },
        'L5': {
            'phase_name': 'COMMIT',
            'description': 'Atomic commitment of changes to the operational environment.',
            'rollback_plan_required': True,
            'subprocess_target': 'CommitHandler'
        },
        'L6': {
            'phase_name': 'EXECUTION',
            'description': 'Post-deployment verification and monitoring activation.',
            'verification_steps': 5,
            'subprocess_target': 'ExecutionMonitor'
        }
    }

    @staticmethod
    def get_sequence_ids() -> List[str]:
        """Returns the defined ordered list of GSEP lock IDs (L0...L6)."""
        return list(GSEP_ConfigModel.CANONICAL_SEQUENCE.keys())
    
    @staticmethod
    def get_phase_metadata(stage_id: str) -> Dict[str, Any]:
        """Retrieves configuration metadata for a specific stage lock."""
        return GSEP_ConfigModel.CANONICAL_SEQUENCE.get(stage_id, {})

    @staticmethod
    def get_phase_name(stage_id: str) -> str:
        """Retrieves the descriptive name of a phase."""
        return GSEP_ConfigModel.get_phase_metadata(stage_id).get('phase_name', stage_id)