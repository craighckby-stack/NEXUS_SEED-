## INTER-AGENT MANDATE COMPLIANCE MANIFEST (IMCM) V95.0

**Classification:** GOVERNANCE_ROOT_CORE (GRC)
**Purpose:** The IMCM establishes the non-negotiable, auditable operational mandates, defined jurisdictional boundaries (Separation of Duties, SoD), and authorized scope for the Sovereign Governance System (SGS), the Global Execution Abstraction (GAX), and the Crypto-Root of Trust (CRoT). This manifest is cryptographically attested by CRoT and serves as the definitive source for the Pre-Flight Mandate Validator (PFMV).

**Integration Point:** Pre-state validation stage (Pre-S1). The PFMV utilizes IMCM specifications to enforce immediate proposal rejection based on mandate violations prior to resource commitment.

### IMCM Schema Definition (Required for CRoT Attestation)

This manifest MUST adhere to the following schema structure, ensuring immutable, verifiable agent contracts.

```json
{
  "version": "V95.0",
  "CRoT_Attestation_Hash": "[CRoT Digital Signature/Hash]",
  "effective_date": "YYYY-MM-DD",
  "mandate_set": [
    {
      "compliance_id": "IMCM-[AGENT]-[ID]",
      "agent": "SGS | GAX | CRoT",
      "scope_type": "JURISDICTIONAL | EXECUTION_CONTROL | INTEGRITY_ENFORCEMENT",
      "restricted_actions": [
        "Description of prohibited action/operation"
      ],
      "mandatory_validators": [
        "PFMV_Hook_Name"
      ],
      "required_approvals": [
        "External agent acceptance signature required for proposal processing"
      ],
      "violation_consequence": "DISCARD_IMMEDIATE | REJECT_AUDIT_REQUIRED"
    }
  ]
}
```

### Mandates (V95.0 Implementation)

```json
{
  "version": "V95.0",
  "CRoT_Attestation_Hash": "[CRoT Attestation Hash]",
  "effective_date": "2024-05-15",
  "mandate_set": [
    {
      "compliance_id": "IMCM-SGS-001",
      "agent": "SGS",
      "scope_type": "EXECUTION_CONTROL",
      "restricted_actions": [
        "Direct mutation of the Policy Validation Lifecycle Manifest (PVLM)",
        "Modification or bypass of the Core File Trust Manifest (CFTM)"
      ],
      "mandatory_validators": ["Check_Root_Integrity_Checksum", "Validate_PVLM_Permissions"],
      "required_approvals": ["GAX_Policy_Acceptance", "CRoT_Audit_Oversight"],
      "violation_consequence": "REJECT_AUDIT_REQUIRED"
    },
    {
      "compliance_id": "IMCM-GAX-002",
      "agent": "GAX",
      "scope_type": "JURISDICTIONAL",
      "restricted_actions": [
        "Unscheduled manipulation of intermediate system state (CISM) data structures",
        "Initiation of atomic execution steps (S11) without full GSEP-C protocol attestation"
      ],
      "mandatory_validators": ["Check_State_Transition_Context", "Verify_Attestation_Sequence"],
      "required_approvals": ["SGS_Commitment_Signature"],
      "violation_consequence": "DISCARD_IMMEDIATE"
    },
    {
      "compliance_id": "IMCM-CRoT-003",
      "agent": "CRoT",
      "scope_type": "INTEGRITY_ENFORCEMENT",
      "restricted_actions": [
        "Unauthorized alteration of the core governance binary definition (GVDM)",
        "Exercising veto authority over the Comprehensive Execution Environment Proposal (CEEP) modeling phase (S5)"
      ],
      "mandatory_validators": ["Audit_Binary_Integrity"],
      "required_approvals": [],
      "violation_consequence": "REJECT_AUDIT_REQUIRED"
    }
  ]
}
```