const ALGORITHM = 'sha256';

/**
 * Recursively builds a strictly canonicalized JSON string directly.
 * Optimizes computational efficiency by avoiding intermediate string copies,
 * utilizing array buffers (parts.join('')) for final output, and performing
 * object key sorting and serialization in a single, streamlined recursive pass.
 * This structure minimizes overhead and maximizes serialization speed.
 *
 * @param {*} data The structure to serialize.
 * @returns {string} A strictly canonicalized JSON string.
 */
function canonicalStringify(data) {
    // Array buffer approach for highly efficient string accumulation
    const parts = [];
    
    function serializeValue(o) {
        // Null check is the fastest path
        if (o === null) {
            parts.push('null');
            return;
        }

        const type = typeof o;

        // --- Primitives Handling (Optimized for minimal branching) ---
        if (type !== 'object') {
            if (type === 'string') {
                // Use built-in JSON.stringify for correct escaping/quotation
                parts.push(JSON.stringify(o));
            } else if (type === 'number' || type === 'boolean') {
                // Direct string conversion is faster than full JSON.stringify for these types
                parts.push(String(o));
            } else {
                // Handles non-serializable primitives (undefined, function, symbol, bigint)
                // Treats them as 'null' when encountered as a standalone value (e.g., in an array).
                parts.push('null');
            }
            return;
        }

        // --- Array Handling ---
        if (Array.isArray(o)) {
            parts.push('[');
            let needsComma = false;
            for (let i = 0; i < o.length; i++) {
                if (needsComma) {
                    parts.push(',');
                }
                serializeValue(o[i]);
                needsComma = true;
            }
            parts.push(']');
            return;
        }

        // --- Object Handling (Canonicalization requires key sorting) ---
        // Key sorting is the most computationally expensive part, performed only once.
        const sortedKeys = Object.keys(o).sort();
        parts.push('{');
        let needsComma = false;
        
        for (const key of sortedKeys) {
            const value = o[key];
            const vType = typeof value;

            // Skip non-serializable property values (undefined, functions, symbols, BigInts)
            if (vType === 'undefined' || vType === 'function' || vType === 'symbol' || vType === 'bigint') {
                continue;
            }
            
            if (needsComma) {
                parts.push(',');
            }

            // Efficiently push key stringification and separator
            parts.push(JSON.stringify(key), ':');
            
            serializeValue(value);
            
            needsComma = true;
        }
        parts.push('}');
    }

    serializeValue(data);
    return parts.join('');
}

module.exports = {
    ALGORITHM,
    canonicalStringify
};