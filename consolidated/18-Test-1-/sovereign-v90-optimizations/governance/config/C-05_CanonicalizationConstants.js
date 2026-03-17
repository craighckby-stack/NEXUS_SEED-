/**
 * governance/config/C-05_CanonicalizationConstants.js
 *
 * This configuration ensures bitwise repeatable JSON serialization necessary
 * for cryptographic hashing across all Sovereign AGI governance modules (M-xx).
 * This configuration directly maps to the C-05 Schema requirements.
 */

interface NumericConstraint {
  FORMAT: "Full Decimal Representation";
  PRECISION_GUARD: "IEEE 754 Doubles Only (No NaN/Infinity)";
}

interface CanonicalizationConstants {
  STANDARD_IDENTIFIER: "JCS-Strict-RFC8785-Profile";
  KEY_ORDERING: "Lexicographical: UTF-8 Binary Comparison";
  ENCODING: "UTF-8";
  WHITESPACE_POLICY: "Compact (No Non-Significant Whitespace)";
  NUMERIC_CONSTRAINT: Readonly<NumericConstraint>;
  DIGEST_ALGORITHM: "SHA3-256";
}

const NUMERIC_CONSTRAINTS: Readonly<NumericConstraint> = Object.freeze({
  FORMAT: "Full Decimal Representation",
  PRECISION_GUARD: "IEEE 754 Doubles Only (No NaN/Infinity)",
});

export const CANONICAL_SERIALIZATION_CONSTANTS: Readonly<CanonicalizationConstants> = Object.freeze({
  STANDARD_IDENTIFIER: "JCS-Strict-RFC8785-Profile",
  KEY_ORDERING: "Lexicographical: UTF-8 Binary Comparison",
  ENCODING: "UTF-8",
  WHITESPACE_POLICY: "Compact (No Non-Significant Whitespace)",
  NUMERIC_CONSTRAINT: NUMERIC_CONSTRAINTS,
  DIGEST_ALGORITHM: "SHA3-256",
});
