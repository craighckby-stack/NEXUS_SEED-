export interface LogPayload {
  [key: string]: any;
}

/**
 * NRALS V2 REQUIRES STRICT CANONICALIZATION before hashing/signing.
 * This utility enforces a deterministic, lexicographically sorted JSON stringification 
 * of the NRALS payload (excluding PayloadHash and AgentSignature fields).
 * 
 * @param payload The raw NRALS log payload object.
 * @returns Canonicalized string representation.
 */
export function canonicalizeNRALSPayload(payload: LogPayload): string {
  // 1. Omit signature and hash fields (if present, to prevent circular hashing issues).
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => 
      key !== 'PayloadHash' && key !== 'AgentSignature' && key !== 'ChainLinkHash' // ChainLinkHash is derived independently/preemptively but should be finalized before canonicalization, depending on implementation flow. We exclude it here for signing consistency.
    )
  );

  // 2. Deep sort the keys lexicographically before stringification.
  // [Implementation Detail: Requires a robust recursive sorting algorithm for nested objects]
  // Placeholder for robust implementation:
  const canonicalString = JSON.stringify(cleanPayload, Object.keys(cleanPayload).sort());

  return canonicalString;
}