export interface LogPayload {
  [key: string]: any;
}

// Interface for the CanonicalSerializationUtility (for type safety in TS)
interface CanonicalSerializationUtility {
    execute(args: { payload: LogPayload; excludeKeys: string[] }): string;
}

// NOTE: In a managed AGI-KERNEL environment, the plugin definition below ensures 
// CanonicalSerializationUtility is available at runtime via injection/global scope.
declare const CanonicalSerializationUtility: CanonicalSerializationUtility;

const NRALS_EXCLUSIONS: string[] = [
  'PayloadHash', 
  'AgentSignature', 
  'ChainLinkHash'
];

/**
 * NRALS V2 REQUIRES STRICT CANONICALIZATION before hashing/signing.
 * This utility enforces a deterministic, lexicographically sorted JSON stringification 
 * of the NRALS payload (excluding specific signature and hash fields).
 * 
 * @param payload The raw NRALS log payload object.
 * @returns Canonicalized string representation.
 */
export function canonicalizeNRALSPayload(payload: LogPayload): string {
  // Use the Canonical Serialization Utility for robust, deep, deterministic sorting and exclusion.
  try {
    const canonicalString = CanonicalSerializationUtility.execute({
      payload: payload,
      excludeKeys: NRALS_EXCLUSIONS
    });
    return canonicalString;
  } catch (error) {
    // Log and rethrow or return a standard error based on system integrity requirements.
    // Since canonicalization is critical for hashing, failure must be fatal.
    console.error("Error during NRALS canonicalization:", error);
    throw new Error("Failed to produce canonical payload string required for NRALS integrity.");
  }
}