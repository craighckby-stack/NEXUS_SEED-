/**
 * CanonicalJson.js
 * ----------------------------------------------------
 * Core utility for generating cryptographically deterministic JSON strings.
 * This implementation delegates the serialization logic to the 
 * `CanonicalJsonStringifier` AGI kernel tool for enhanced isolation and reuse.
 */

// Note: Assuming 'CanonicalJsonStringifier' tool is available via global context or injection mechanism.
declare const CanonicalJsonStringifier: { execute: (data: any) => string };

export class CanonicalJson {
  
  /**
   * Delegates the actual canonical serialization to the external AGI kernel tool.
   * This acts as an I/O proxy for architectural separation.
   * @param data The object to serialize.
   * @returns The canonical JSON string.
   * @throws Error if the tool is unavailable or execution fails.
   */
  private static #delegateToStringifierExecution(data: any): string {
    if (typeof CanonicalJsonStringifier !== 'object' || typeof CanonicalJsonStringifier.execute !== 'function') {
      // Throw a specific internal error if the mandatory external dependency is missing.
      throw new Error("Internal Error: CanonicalJsonStringifier tool is not available.");
    }
    return CanonicalJsonStringifier.execute(data);
  }

  /**
   * Generates a canonical JSON string for a given object by recursively
   * serializing it while maintaining strict ordering and formatting rules.
   * @param {Object} data - The object to serialize.
   * @returns {string} The canonical JSON string.
   * @throws {Error} If non-finite numbers (NaN, Infinity) are encountered.
   */
  static stringify(data: any): string {
    try {
      // Utilize the isolated I/O proxy function
      return CanonicalJson.#delegateToStringifierExecution(data);
    } catch (e) {
      const error = e as Error;
      
      // Map specific internal errors to external domain errors
      if (error.message.includes('Non-finite numbers')) {
        throw new Error(`Canonical JSON Error: Invalid data structure encountered: ${error.message}`);
      }
      
      // Re-throw generic serialization failures
      throw new Error(`Canonical JSON Serialization Failed: ${error.message}`);
    }
  }
}

export default CanonicalJson;