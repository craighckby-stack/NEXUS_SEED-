## Schema Repository Service (SRS) Specification V2.0: Attested Schema Integrity

**MISSION:** To provide the Sovereign AGI stack with a single, cryptographically attested, versioned, and state-managed source of truth for all governance-critical schemas. The SRS guarantees the immutability and verifiable integrity of schema definitions, critical for ensuring adherence to `GIRM` constraints and `IDR` integrity.

**INTEGRATION:** Primary dependency for the Governance Incident Response Mechanism (GIRAM), the Constraint Orchestrator (GCO), and the Root Governance Interpreter (RGI).

### 1. Schema Lifecycle States:
Schemas transition through defined states to ensure rigorous vetting and attestation:
*   `DRAFT`: Initial design state, uncommitted.
*   `PROPOSED`: Vetted internally, awaiting GRTA signature.
*   `ATTESTED`: Signed by GRTA, committed to DILS, and active for use (READ-ONLY).
*   `DEPRECATED`: Replaced by a newer version, retained for historical integrity checks.

### 2. Core Functionality:
1.  **Integrity & State Management:** Tracks schema state and ensures integrity via cryptographic attestation tied to DILS.
2.  **Versioned Lookup (Deterministic):** Provides specific schema versions using an index hash.
3.  **Efficiency Lookup (Latest):** Allows consumers to retrieve the most recent `ATTESTED` version without prior knowledge of the latest hash.
4.  **Dependency Mapping:** Maintains a metadata map linking schemas to the specific governance components they constrain (e.g., linking `IDR_Schema_V02` to `GIRAM`).

### 3. Interface Contract (ISRS V2.0):

| Function | Parameters | Returns | Notes |
| :--- | :--- | :--- | :--- |
| `ISRS_RequestByHash` | `SchemaName: string`, `VersionHash: CryptographicHash` | `{ SchemaDef: JSON, AttestationHash: CryptographicHash }` | Verifies full integrity chain. |
| `ISRS_RequestLatest` | `SchemaName: string` | `{ SchemaDef: JSON, AttestationHash: CryptographicHash }` | Returns the schema in `ATTESTED` state with the highest version.
| `ISRS_AuditLog` | `SchemaName: string`, `VersionHash?: CryptographicHash` | `[ DILS_TransactionRef, Timestamp, SchemaState ]` | Provides the ledger trail for state changes.
| `ISRS_CommitNewVersion` | `SchemaDef: JSON`, `Metadata: JSON` | `CryptographicHash` | (GRTA-ONLY access) Submits schema for signing and DILS commitment.

**Data Types:** `CryptographicHash` is defined as SHA3-512(SchemaDefinition + GRTA_Signature) committed via DILS.
