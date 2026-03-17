## Cryptographic Non-Repudiable Entry Schema V1 (CNRE_Schema_V1)

**MISSION:** Define the canonical JSON structure for the `IB_Commitment_Payload` prior to cryptographic signing, ensuring interoperability between IBCM, GIRAM, and the DILS platform.

**SCHEMA TYPE:** Governance Baseline Commitment

| Field Name | Type | Description | Constraints |
|---|---|---|---|
| `version` | String | Schema Version Identifier. | Must be "V1" |
| `baseline_timestamp_utc` | ISO 8601 String | Time of Phase II completion (BHG). | UTC, high-precision |
| `system_release_tag` | String | The target release identifier being governed. | Non-null, immutable |
| `composite_hash_sha512` | String | The root hash derived from the concatenation of all approved artifacts and metadata. | SHA-512 required |
| `artifact_manifest_hash` | String | Reference hash linking back to the `CrypVer-S02` manifest used for Phase I validation. | Ensures artifact completeness |
| `origin_trace_module` | String | The module initiating the commitment sequence (e.g., IBCM_S01). | Required for auditing |
| `egom_approval_token_ref` | String | Cryptographic reference ID of the approval token provided by EGOM. | Links commitment to authorization |
