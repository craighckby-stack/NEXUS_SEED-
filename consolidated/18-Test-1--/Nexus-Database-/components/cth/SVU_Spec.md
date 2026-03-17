# Schema Validation Utility (SVU) Specification

## SVU Protocol Mandate

The SVU is a core L2 component required by the Configuration Trust Handler (CTH) to enforce the structural and semantic rigidity of the staged configuration artifacts ($\mathcal{C}$) during the SCM-L2 phase. The SVU must provide deterministic, tamper-proof validation results based exclusively on the Protocol Definition Schemas (PDS).

## Design Requirements

1.  **Isolation:** The SVU execution environment must be fully sandboxed, preventing any external I/O or state modification during the validation process. 
2.  **Schema Language Mandate:** The SVU must support validation against strict, standardized schema definitions. Mandatory adherence to **JSON Schema Draft 2020-12** is required for all PDS definitions.
3.  **Semantic Depth:** The SVU must perform deep type checking, enumeration constraint verification, and mandatory enforcement of dependency fields, including Explicit Entry Dependency Schemas (EEDS).

## API Specification (Required Interface)

The SVU component must expose a singular, non-blocking synchronous entry point:

### `validate_config_set(config_data: bytes, schema_id: str) -> ValidationResult`

**Parameters:**
*   `config_data`: The raw byte stream of the configuration artifact staged in SCSA.
*   `schema_id`: A URI or key resolving the required PDS schema (sourced from the Schema Repository).

**Return Type:** `ValidationResult` (Structured Object)

**Fields of ValidationResult:**
| Field | Type | Description |
| :--- | :--- | :--- |
| `Success` | boolean | True if the configuration passed all structural and semantic checks. |
| `Report` | list<string> | List of all detected violations/errors (empty upon success). |
| `Hash_Trace` | string (SHA-256) | Hash of the input configuration data processed, used for auditable logging. |

## Failure Mode

Any internal failure of the SVU (e.g., corrupted schema lookup, engine error) must result in an immediate `ValidationResult.Success = False` with a `Report` indicating an internal SVU diagnostic failure, triggering the CTH SCM-L2 integrity halt (C-IH).