# KVM-01 PROTOCOL: KEY VALIDATION MANDATE

## MANDATE
To ensure the non-repudiation and integrity of the SSC-01 commitment process, the Key Validation Module (KVM-01) SHALL manage and provide real-time status validation for the Sovereign Core Signing Key (SCSK). KVM-01 establishes the cryptographic chain-of-custody required for P7.3 and defines the mechanism for cryptographic asset lifecycle management (CALM).

## RESPONSIBILITIES
1. **SCSK Attestation:** KVM-01 MUST perform continuous, low-latency attestation checks against the physical or virtual HSM containing the SCSK.
2. **Revocation List Maintenance:** Maintain and publish a validated Cryptographic Key Revocation List (CKRL).
3. **Integrity Confirmation:** Provide an authorized API endpoint for the SSC-01 module to retrieve the current, verifiable Key Validation Metadata (KVM-Ref), which includes the timestamp of last successful attestation and the active status (Valid/Compromised/Revoked).

## FAILURE CRITERIA
KVM-01 MUST issue an immediate SCSK Integrity Breach signal (E7.3 reference) if:
*   Attestation Check Fails.
*   SCSK is discovered on the CKRL.
*   Secure communication channel to the HSM cluster is broken.