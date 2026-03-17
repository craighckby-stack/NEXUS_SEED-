# CERTIFIED STATE TRANSITION LEDGER (CSTL) ACCESS SPECIFICATION

This specification defines the mandatory, attested communication protocol for interacting with the CRoT-managed Certified State Transition Ledger (CSTL). All access must adhere to the principles of cryptographic non-repudiation and temporal integrity.

## 1.0 ACCESS PRINCIPLES

1.  **Immutability:** Write operations (S10 commitment) must be strictly append-only.
2.  **Attestation:** All ingress must be wrapped by the Signed Transaction Envelope Standard (STES) schema, signed by the originating agent (SGS for packaging, CRoT for final commit).
3.  **Protocol:** All communication defaults to attested, mutually authenticated TLS/gRPC connections.

## 2.0 CRITICAL API ENDPOINTS

| Endpoint | Purpose | Requiring Agent(s) | Required Artifact(s) |
|:---|:---|:---|:---|
| `POST /state/commit` | Finalized, atomic state commit (GSEP-C S10). | CRoT | STES, CSTL |
| `GET /state/latest` | Retrieve the last successfully committed state ($\Psi_{N}$). | SGS, GAX | CSTL |
| `GET /state/{N}` | Retrieve a specific historical state transition. | SGS, GAX | CSTL |
| `POST /state/veto_record` | Non-repudiable VRRM entry logging (GSEP-C S9, post-veto). | SGS | VRRM, STES |

## 3.0 DATA PAYLOAD REQUIREMENTS (STES Standard)

All commit requests must contain a cryptographic signature block (`signature_payload`) adhering to the STES schema, proving both agent origin (CRoT) and integrity of the enclosed transition manifest ($\Psi_{N}\to\Psi_{N+1}$ summary).