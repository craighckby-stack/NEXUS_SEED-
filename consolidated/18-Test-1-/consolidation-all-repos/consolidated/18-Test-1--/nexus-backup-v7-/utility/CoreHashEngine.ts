/**
 * CoreHashEngine.ts
 * Delegates canonical JSON serialization and SHA-256 hashing for GSC proposals 
 * to the specialized CanonicalIntegrityHashUtility plugin.
 * This utility is critical for generating reproducible 'integrity_checksum' values.
 */

// Defines the interface for the extracted utility plugin
declare const CanonicalIntegrityHashUtility: {
    /**
     * Calculates the integrity checksum for a given object after canonicalizing it 
     * and excluding integrity-related fields.
     * @param proposal The raw object.
     * @returns The SHA-256 integrity hash string.
     */
    calculateProposalChecksum(proposal: object): string;
};

/**
 * Calculates the integrity checksum for a given GSC proposal by delegating 
 * to the specialized utility which handles canonicalization and field exclusion.
 *
 * @param proposal The raw GSC proposal object.
 * @returns The SHA-256 integrity hash string.
 */
export function calculateProposalChecksum(proposal: object): string {
    if (typeof CanonicalIntegrityHashUtility === 'object' && typeof CanonicalIntegrityHashUtility.calculateProposalChecksum === 'function') {
        return CanonicalIntegrityHashUtility.calculateProposalChecksum(proposal);
    }
    
    // This state indicates a critical failure in dependency injection or plugin loading.
    throw new Error("CanonicalIntegrityHashUtility is not available in the runtime environment.");
}