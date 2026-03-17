/**
 * FILE: protocol/governance/key_revocation_api_spec.js
 * Sovereign System Key Revocation API Specification (OCS).
 * Mission Compliance: P-R03 and DARM governance.
 */
const KeyRevocationAPISpec = Object.freeze({
  apiVersion: "V1.0.0",
  name: "Online Certificate Status (OCS) / Key Revocation API",
  purpose: "Defines the external interface for verifying the live revocation status of Key Identifiers (KID) used for artifact sealing, supporting P-R03 and DARM governance compliance.",
  endpoint: "/v1/governance/ocs/key_status",
  method: "POST",
  requestSchema: {
    requiredFields: [
      "keyIdentifier",
      "verificationTimestampUtc"
    ],
    keyIdentifierFormat: "DID_URN:v1:AASS-KID:[hash]"
  },
  responseSchema: {
    statusCode: 200,
    fields: {
      keyIdentifier: "string",
      isRevoked: "boolean",
      revocationReason: "string (null if not revoked)",
      effectiveSinceUtc: "string (ISOString, null if not revoked)"
    }
  },
  failureCodes: {
    "404": "KID not found in registry",
    "503": "DARM governance service unavailable"
  }
});

// Provides exports for direct consumption.
export { KeyRevocationAPISpec };
export default KeyRevocationAPISpec;