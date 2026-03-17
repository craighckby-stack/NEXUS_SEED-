/**
 * Type safety for Chronology IDs. This branded type enforces that they are 
 * treated distinctly from general strings when interacting with domain objects
 * and database layers.
 *
 * ChronoIds are specifically designed to be time-sortable and globally unique.
 */
export type ChronoId = string & { readonly __chronoIdBrand: unique symbol };

/**
 * Contract for generating time-sortable, globally unique identifiers (ChronoIds).
 * Utilizing standardized algorithms (like ULID or KSUID) ensures IDs are 
 * chronologically ordered, optimizing time-series database indexing and 
 * retrieval performance while preventing sequential guessing attacks.
 */
export interface ChronoIdGenerator {
  /**
   * Generates a new, chronologically-ordered unique ID.
   * @returns A new ChronoId string.
   */
  generateId(): ChronoId;

  /**
   * Extracts the creation timestamp from a generated ID.
   *
   * Implementation must handle the decoding specific to the underlying 
   * algorithm (e.g., ULID decoding of the first 48 bits).
   *
   * @param chronoId The Chronology ID.
   * @returns The associated Unix epoch timestamp (milliseconds).
   */
  extractTimestamp(chronoId: ChronoId): number;

  /**
   * Validates if the given string adheres to the expected ChronoId format and 
   * encoding (e.g., Crockford Base32 for ULID). 
   * This ensures runtime integrity before database lookups or serialization.
   *
   * @param value The string to validate.
   * @returns True if valid, false otherwise.
   */
  isValid(value: string): value is ChronoId;
}