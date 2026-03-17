/**
 * IHasher (Interface for Hashing Utilities)
 * Role: Provides standardized, deterministic serialization and hashing functionality
 *       to modules requiring cryptographic integrity checks (e.g., DSCM, MICM).
 * Note: Implementations must guarantee consistent output (deterministic serialization) given identical input object structures.
 */
export interface IHasher {
    /**
     * Generates a deterministic cryptographic hash (e.g., SHA-256) of the input data.
     * @param data The structure or primitive data to hash.
     * @returns The generated hash string.
     */
    hash(data: unknown): string;
}