/**
 * TEDS_Canonicalizer.ts
 *
 * Utility to enforce a deterministic structure on TEDS objects before cryptographic hashing.
 * This ensures signature verification is reproducible across all environments, regardless of JSON implementation details (like key order).
 */

import { TedsObject } from '../types/TedsTypes'; // Placeholder type definition
import { stableStringify } from '@sovereign/common/utils/json'; // Requires a robust external utility

/**
 * Canonicalizes the TEDS payload, prepares it for hashing, and excludes the signature field.
 * @param tedsObject The raw TEDS payload instance.
 * @returns The byte-for-byte deterministic string representation ready for hashing.
 */
export function canonicalizeTEDS(tedsObject: TedsObject): string {
    const payloadForSigning = { ...tedsObject };

    // Mandatory exclusion: The signature payload must not be included in the content being signed.
    if (payloadForSigning.attestation && payloadForSigning.attestation.signature_payload) {
        delete payloadForSigning.attestation.signature_payload;
    }

    // We rely on a proven utility (`stableStringify`) that guarantees sorted key ordering
    // and minimal/no whitespace (i.e., JSON.stringify(data, null, 0))
    const canonicalString = stableStringify(payloadForSigning);

    return canonicalString;
}