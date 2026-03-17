/**
 * CanonicalJson.js
 * ----------------------------------------------------
 * Core utility for generating cryptographically deterministic JSON strings.
 * This implementation strictly adheres to requirements for cryptographic safety
 * by ensuring mandatory key sorting, deterministic spacing (none), and robust
 * primitive handling (e.g., prohibiting non-finite numbers).
 * Suitable for hashing/signing inputs (e.g., JCS / RFC 8785 conventions).
 */

export class CanonicalJson {
  /**
   * Generates a canonical JSON string for a given object by recursively
   * serializing it while maintaining strict ordering and formatting rules.
   * @param {Object} data - The object to serialize.
   * @returns {string} The canonical JSON string.
   * @throws {Error} If non-finite numbers (NaN, Infinity) are encountered.
   */
  static stringify(data) {
    try {
      return CanonicalJson._serializeValue(data);
    } catch (e) {
      if (e instanceof Error && e.message.includes('Non-finite numbers')) {
        throw new Error(`Canonical JSON Error: Invalid data structure encountered: ${e.message}`);
      }
      throw new Error(`Canonical JSON Serialization Failed: ${e.message}`);
    }
  }

  /**
   * Recursively serializes a value into its canonical string representation.
   * This function controls all aspects of formatting, key sorting, and primitive handling.
   * @param {*} value - The value to serialize.
   * @returns {string | undefined} The serialized string, or undefined if the value should be ignored (e.g., functions in objects).
   */
  static _serializeValue(value) {
    // 1. Handle Primitives and Null
    if (value === null) {
      return 'null';
    }

    const type = typeof value;

    if (type === 'string') {
      // Rely on JSON.stringify for safe, standardized escaping of string primitives.
      return JSON.stringify(value);
    }

    if (type === 'number') {
      // CRITICAL: JCS disallows non-finite numbers.
      if (!isFinite(value)) {
        throw new Error('Non-finite numbers (NaN, Infinity) are prohibited in canonical JSON.');
      }
      // Use built-in serialization, which produces the most compact, precise string form.
      return String(value);
    }

    if (type === 'boolean') {
      return value ? 'true' : 'false';
    }

    // 2. Handle Arrays (elements are serialized recursively, no inherent sorting needed for array structure)
    if (Array.isArray(value)) {
      const elements = value
        .map(v => {
          const result = CanonicalJson._serializeValue(v);
          // In arrays, undefined/functions are coerced to null (standard JSON behavior)
          return result === undefined ? 'null' : result;
        });
      return `[${elements.join(',')}]`;
    }

    // 3. Handle Objects (requires key sorting)
    if (type === 'object') {
      const keys = Object.keys(value).sort();
      const parts = [];

      for (const key of keys) {
        // Serialize the key string first (standard JSON string escaping)
        const serializedKey = JSON.stringify(key);
        const serializedValue = CanonicalJson._serializeValue(value[key]);

        // Properties whose value serializes to undefined (functions, undefined) are skipped in objects (standard JSON behavior)
        if (serializedValue !== undefined) {
          parts.push(`${serializedKey}:${serializedValue}`);
        }
      }
      return `{${parts.join(',')}}`;
    }

    // 4. Handle Unsupported Types (functions, undefined, symbols)
    // When encountered directly (not inside an array/object structure walk), these are generally invalid for JCS, 
    // but if passed as the root, standard JSON.stringify handles it, however, since we are aiming for high-assurance, 
    // if we encounter these in object value recursion, they are skipped (returning undefined).
    return undefined; // Indicates the property should be ignored/skipped in the parent object.
  }
}

export default CanonicalJson;
