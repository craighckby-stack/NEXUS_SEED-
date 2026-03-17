import * as crypto from 'crypto';

/**
 * Defines the standard cryptographic algorithm used for ACVD integrity checks.
 * Must be compatible with Node's crypto module.
 */
export const ALGORITHM = 'sha256';

/**
 * Recursively sorts keys of an object to ensure deterministic output for hashing.
 * This guarantees cryptographic integrity across different execution environments.
 * @param obj The object to canonicalize.
 * @returns A strictly canonicalized JSON string.
 */
export function canonicalStringify(obj: object): string {
    // Note: This robust approach ensures key order is maintained deterministically.
    // We use a safe deep stringify/parse cycle to handle nesting, relying on Array.sort() behavior
    // for key sorting, which is critical for canonical representation.

    function sortObjectKeys(o: any): any {
        if (typeof o !== 'object' || o === null) {
            return o;
        }
        if (Array.isArray(o)) {
            // Recursive canonicalization for array items
            return o.map(sortObjectKeys);
        }
        
        const sortedKeys = Object.keys(o).sort();
        const sortedObject: Record<string, any> = {};
        
        for (const key of sortedKeys) {
            sortedObject[key] = sortObjectKeys(o[key]);
        }
        return sortedObject;
    }

    const canonicalObj = sortObjectKeys(obj);
    return JSON.stringify(canonicalObj);
}
