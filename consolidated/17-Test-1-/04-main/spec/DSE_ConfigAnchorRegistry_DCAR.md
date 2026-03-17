# DCAR: DSE Configuration Anchor Registry Specification v1.0

## 0. MISSION

The DCAR is the centralized, immutable ledger for verified DSE system configuration baselines ($\mathcal{B}$). Its primary function is to serve as a reliable, non-mutating source of truth for the DIAL integrity analysis process following an Integrity Halt (IH) event.

## I. ANCHORING MECHANISM

Configurations are anchored only after passing the internal DSE Validation Stage (S00) and before being utilized by the GSEP-C pipeline. Each anchor is indexed by an Epoch ID.

1.  **Immutability:** Once committed, a configuration baseline cannot be altered. New versions require a new Epoch ID.
2.  **Indexing:** Baselines must be retrievable using either the precise Epoch ID or a Configuration State Record (CSR) hash reference.

## II. DATA SCHEMA ($\mathcal{B}$)

The anchored baseline data must include all expected integrity check parameters necessary for comparison by DIAL.

| Field | Description | Type | Integrity |
|:---:|:---:|:---:|:---:|
| `epoch_id` | Unique ID for the specific configuration version. | UUIDv7 | Primary Index |
| `anchor_timestamp` | Time of successful configuration validation/commit. | ISO_8601 | Required |
| `expected_csr` | Full expected Configuration Policy Snapshot (Baseline). | Hashed JSON | Integrity Hash (Root) |
| `expected_ecvm_schema` | Defined constraints for ECVM validation. | JSON Schema | Required |
| `gax_thresholds` | Pre-defined thresholds for GAX I, II, and III. | Map | Required |
| `dc_signature` | Cryptographic proof of DCAR commitment. | String | Must be verifiable |

## III. API ENDPOINTS (DIAL Consumer)

DCAR exposes a minimal read-only API primarily for consumption by DIAL and GSEP-C validation services.

*   `GET /baseline/{epoch_id}`: Retrieves the complete $\mathcal{B}$ anchored by `epoch_id`.
*   `VERIFY /integrity/{epoch_id}`: Checks the internal integrity signature of the stored baseline.