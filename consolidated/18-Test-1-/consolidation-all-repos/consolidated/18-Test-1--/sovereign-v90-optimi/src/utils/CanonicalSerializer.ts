/**
 * Interface for the Canonical Serialization Utility provided by the kernel/plugins.
 */
interface ICanonicalSerializationUtility {
    /**
     * Converts data into a deterministic string representation suitable for hashing
     * by recursively sorting object keys.
     * @param data The structure to serialize canonically.
     * @returns A deterministic JSON string.
     */
    canonicalSerialize(data: unknown): string;
}

// Assume the plugin is available via a standardized access mechanism (e.g., global KernelPlugins)
declare const KernelPlugins: {
    CanonicalSerializationUtility: ICanonicalSerializationUtility;
};

/**
 * Utility responsible for converting JavaScript objects into a canonical (deterministic)
 * string representation, essential for cryptographic hashing and integrity checks.
 * 
 * This implementation delegates the core logic to the high-integrity CanonicalSerializationUtility plugin.
 */
export function canonicalSerialize(data: unknown): string {
    // Delegate execution to the optimized and tested plugin utility
    return KernelPlugins.CanonicalSerializationUtility.canonicalSerialize(data);
}