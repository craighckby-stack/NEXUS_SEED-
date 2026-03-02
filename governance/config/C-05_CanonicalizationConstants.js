/**
 * governance/config/C-05_CanonicalizationConstants.js
 *
 * This configuration ensures bitwise repeatable JSON serialization necessary
 * for cryptographic hashing across all Sovereign AGI governance modules (M-xx).
 * This configuration directly maps to the C-05 Schema requirements.
 */
export const CANONICAL_SERIALIZATION_CONSTANTS = Object.freeze({
  STANDARD_IDENTIFIER: "JCS-Strict-RFC8785-Profile",
  KEY_ORDERING: "Lexicographical: UTF-8 Binary Comparison",
  ENCODING: "UTF-8",
  WHITESPACE_POLICY: "Compact (No Non-Significant Whitespace)",
  NUMERIC_CONSTRAINT: {
    FORMAT: "Full Decimal Representation",
    PRECISION_GUARD: "IEEE 754 Doubles Only (No NaN/Infinity)",
  },
  DIGEST_ALGORITHM: "SHA3-256",
});
