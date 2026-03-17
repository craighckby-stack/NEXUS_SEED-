import { ChronoId, ChronoIdGenerator } from "./ChronoIdGenerator";
// Assuming the 'ulid' package is installed and used across the system.
import { ulid, decodeTime } from 'ulid';

/**
 * A concrete implementation of ChronoIdGenerator utilizing the ULID specification.
 * 
 * ULIDs are ideal because they are lexicographically sortable, highly random 
 * in the latter half, and use the URL-safe Crockford Base32 encoding.
 */
export class UlidChronoIdGenerator implements ChronoIdGenerator {

    // Regular expression for basic ULID format validation: 26 chars, Base32 alphabet.
    private readonly ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

    /**
     * Generates a new ULID string.
     */
    public generateId(): ChronoId {
        // ULID libraries handle collision protection and time management automatically.
        return ulid() as ChronoId;
    }

    /**
     * Extracts the timestamp from a ULID by decoding the first 48 bits.
     * @param chronoId The ULID string.
     * @returns The associated Unix epoch timestamp (milliseconds).
     */
    public extractTimestamp(chronoId: ChronoId): number {
        // decodeTime is a utility specific to reading the ULID time component.
        return decodeTime(chronoId);
    }

    /**
     * Validates the input string against ULID structure and length.
     * @param value The string to validate.
     * @returns True if the string looks like a valid ULID.
     */
    public isValid(value: string): value is ChronoId {
        if (typeof value !== 'string' || value.length !== 26) {
            return false;
        }
        
        // Check against the valid ULID character set and length constraint.
        return this.ULID_REGEX.test(value);
    }
}