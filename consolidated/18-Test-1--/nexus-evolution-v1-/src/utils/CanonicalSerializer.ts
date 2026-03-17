/**
 * Utility responsible for converting JavaScript objects into a canonical (deterministic)
 * string representation, essential for cryptographic hashing and integrity checks.
 * 
 * Implementations must ensure that object key insertion order does not affect the final
 * string output (e.g., by recursively sorting keys).
 */

/**
 * Converts data into a deterministic string representation suitable for hashing.
 * 
 * NOTE: A production implementation should use optimized external libraries (like
 * 'fast-json-stable-stringify') or highly rigorous recursive sorting to handle
 * complex types (Maps, Sets) and prevent serialization bugs.
 * 
 * @param data The structure to serialize canonically.
 * @returns A deterministic JSON string.
 */
export function canonicalSerialize(data: unknown): string {
    const sortKeys = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(sortKeys);
        }

        // Create a new object with keys sorted lexicographically
        const sortedKeys = Object.keys(obj).sort();
        const newObj: { [key: string]: any } = {};

        for (const key of sortedKeys) {
            newObj[key] = sortKeys(obj[key]);
        }
        return newObj;
    };

    // Recursively sort the keys before standard stringification
    const sortedData = sortKeys(data);
    
    // Standard JSON.stringify converts the sorted structure into the canonical string
    return JSON.stringify(sortedData);
}