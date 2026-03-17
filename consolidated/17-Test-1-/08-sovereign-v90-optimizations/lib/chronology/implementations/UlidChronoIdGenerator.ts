import { ChronoIdGenerator, ChronoId } from '../ChronoIdGenerator';
import { ulid, decodeTime } from 'ulid';
import { UlidFormatValidator } from '../../utils/UlidFormatValidator'; // Abstracted utility for format validation

/**
 * Concrete implementation of ChronoIdGenerator utilizing the ULID (Universally Unique Lexicographically Sortable Identifier) algorithm.
 * ULIDs are 128-bit identifiers designed to be sorting-compatible with timestamps and randomness.
 */
export class UlidChronoIdGenerator implements ChronoIdGenerator {

  // --- Private I/O Proxy Methods ---

  /**
   * Delegates the actual ULID generation to the external library function.
   */
  #delegateToUlidGeneration(): ChronoId {
    return ulid() as ChronoId;
  }

  /**
   * Delegates the timestamp decoding using the external ULID utility.
   */
  #delegateToExtractTimestamp(chronoId: ChronoId): number {
    // Note: decodeTime handles the validation internally based on the ULID spec.
    return decodeTime(chronoId);
  }

  /**
   * Delegates the format validation check to the abstracted utility.
   */
  #delegateToValidationExecution(value: string): value is ChronoId {
    return UlidFormatValidator.isValid(value) as value is ChronoId;
  }

  // --- Public API Implementation ---

  /**
   * Generates a new ULID.
   */
  public generateId(): ChronoId {
    return this.#delegateToUlidGeneration();
  }

  /**
   * Extracts the creation timestamp (milliseconds) from the ULID.
   * @param chronoId The ULID string.
   * @returns The associated Unix epoch timestamp (milliseconds).
   */
  public extractTimestamp(chronoId: ChronoId): number {
    return this.#delegateToExtractTimestamp(chronoId);
  }

  /**
   * Validates if the string is a valid ULID (26 characters, Base32 encoding).
   */
  public isValid(value: string): value is ChronoId {
    return this.#delegateToValidationExecution(value);
  }
}