/**
 * ICryptographicIntegrity
 * Defines the standard contract for integrity services focused on generating
 * reproducible cryptographic identifiers for state and configuration data.
 * Implementation MUST ensure canonical serialization (e.g., deterministic JSON
 * with sorted keys) prior to hashing, typically using a standard algorithm like SHA-256.
 */
export interface ICryptographicIntegrity {
    /**
     * Generates a deterministic cryptographic digest for the input data structure.
     * The output format is standardized (e.g., lowercase hexadecimal).
     *
     * @param data The data structure (object, array, primitive) requiring an integrity check or identifier.
     * @returns The resulting cryptographic hash string (e.g., SHA-256 hex digest).
     */
    hash(data: unknown): string;
}
