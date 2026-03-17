/**
 * Internal recursive function to sort object keys and detect circular dependencies,
 * generating a stable data structure ready for deterministic JSON stringification.
 * This helper serves as the synchronous data preparation step, isolating complex 
 * recursive logic from the primary execution function (`stableStringify`).
 * 
 * @param value The object or array to process.
 * @param seen WeakSet tracking visited objects to prevent cycles.
 * @returns The deterministically sorted and cycle-free representation, or undefined if a cycle is hit.
 */
function _generateStableStructure(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown | undefined {
    
    // Check 1: Primitives
    if (value === null || typeof value !== 'object') {
        return value; 
    }

    // Check 2: Cycle detection
    if (seen.has(value as object)) {
        return undefined; // Omit circular reference
    }
    seen.add(value as object);

    if (Array.isArray(value)) {
        // Handle arrays: recurse and filter out circular branches (undefined)
        return value
            .map(item => _generateStableStructure(item, seen))
            .filter(item => item !== undefined);
            
    } else {
        // Handle objects: Sort keys and recurse
        const keys = Object.keys(value as object).sort();
        const cleanedObject: Record<string, unknown> = {};

        for (const key of keys) {
            const processedValue = _generateStableStructure((value as Record<string, unknown>)[key], seen);
            
            // Only include non-undefined values (omits cycle branches)
            if (processedValue !== undefined) {
                cleanedObject[key] = processedValue;
            }
        }
        return cleanedObject;
    }
}

/**
 * Deterministically converts a JavaScript value to a stable JSON string.
 * Ensures object keys are sorted recursively and handles circular dependencies.
 * 
 * Performance Improvement: Replaced external class instantiation (DeterministicDataPreprocessor) 
 * with an internal, optimized recursive preparation function.
 *
 * @param value The value to convert.
 * @param replacer A function that alters the behavior of the stringification process.
 * @param space Adds indentation, white space, and line break characters to the output JSON string.
 * @returns The stable JSON string.
 */
export function stableStringify(value: unknown, replacer?: (key: string, value: unknown) => unknown, space?: string | number): string {
    
    try {
        // Step 1: Prepare the data for deterministic serialization (sort keys, remove cycles).
        const sortedValue = _generateStableStructure(value);
        
        // If the entire root structure was deemed unrepresentable (e.g., circular self-reference), return stable 'null'.
        if (sortedValue === undefined) {
            return 'null'; 
        }

        // Step 2: Final stringification.
        return JSON.stringify(sortedValue, replacer, space);
    } catch (e) {
        // Enhanced Error Handling capability: Return a structured JSON error object.
        console.error("[Stable Stringify] Fatal serialization failure during preparation or stringification:", e);
        return JSON.stringify({
            error: "FATAL_SERIALIZATION_FAILURE", 
            message: String(e)
        });
    }
}