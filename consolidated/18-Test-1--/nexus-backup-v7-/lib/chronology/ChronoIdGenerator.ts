/**
 * Type safety for Chronology IDs. This branded type enforces that they are 
 * treated distinctly from general strings when interacting with domain objects
 * and database layers.
 */
export type ChronoId = string & { readonly __chronoIdBrand: unique symbol };

/**
 * Contract for generating time-sortable, globally unique identifiers (ChronoIds).
 * Using algorithms like ULID or KSUID ensures IDs are chronologically ordered, 
 * optimizing time-series database indexing and retrieval performance.
 */
export interface ChronoIdGenerator {
  /**
   * Generates a new, chronologically-ordered unique ID.
   * @returns A new ChronoId string.
   */
  generateId(): ChronoId;

  /**
   * Extracts the creation timestamp from a generated ID.
   * Note: The precision (milliseconds or seconds) depends on the underlying algorithm.
   * ULID, for example, typically uses millisecond precision.
   * @param chronoId The Chronology ID.
   * @returns The associated Unix epoch timestamp (milliseconds).
   */
  extractTimestamp(chronoId: ChronoId): number;

  /**
   * Validates if the given string adheres to the expected ChronoId format and encoding.
   * This ensures runtime integrity before database lookups or serialization.
   * @param value The string to validate.
   * @returns True if valid, false otherwise.
   */
  isValid(value: string): value is ChronoId;
}
