/**
 * TEDS_Canonicalizer.ts
 *
 * Utility to enforce a deterministic structure on TEDS objects before cryptographic hashing.
 * This ensures signature verification is reproducible across all environments, regardless of JSON implementation details (like key order).
 *
 * Key Design Principle: Strict Immutability of Input Objects.
 */

import { TedsObject } from '../types/TedsTypes'; // Placeholder type definition
// Using AGI-KERNEL Plugin: CanonicalSerializationUtility

// --- Plugin Access Simulation ---
/**
 * Interface proxy for the CanonicalSerializationUtility plugin.
 * This utility provides deterministic (stable, key-sorted) JSON stringification.
 */
declare const CanonicalSerializationUtility: {
    canonicalize: (payload: any) => string;
};
// ---------------------------------


/**
 * Canonicalizes the TEDS payload, prepares it for hashing, and strictly excludes the signature field.
 *
 * Crucially, this function ensures that the original `tedsObject` is never mutated,
 * even when deleting nested properties (like `signature_payload`).
 *
 * @param tedsObject The raw TEDS payload instance.
 * @returns The byte-for-byte deterministic string representation ready for hashing.
 */
export function canonicalizeTEDS(tedsObject: TedsObject): string {
    // Create a shallow copy of the top-level structure.
    const payloadForSigning = { ...tedsObject };

    const attestation = payloadForSigning.attestation;
    // Check if attestation exists and if signature_payload is present within it.
    const signaturePresent = attestation && typeof attestation === 'object' && attestation.signature_payload !== undefined;

    if (signaturePresent) {
        // Vulnerability Mitigation:
        // If we modify a nested property (like deleting signature_payload) in a shallow copy,
        // we risk mutating the reference in the original object. We must deep clone the
        // attestation object itself before performing the deletion.
        
        payloadForSigning.attestation = { ...(attestation as object) };

        // Mandatory exclusion: The signature payload must not be included in the content being signed.
        delete payloadForSigning.attestation.signature_payload;
    }

    // We use the CanonicalSerializationUtility plugin to guarantee sorted key ordering
    // and minimal/no whitespace (i.e., minimal JSON representation).
    return CanonicalSerializationUtility.canonicalize(payloadForSigning);
}