/**
 * APM_Canonizer: Canonical JSON Stringification Utility.
 * 
 * Ensures deterministic byte representation of the APM object for hashing and signing operations, 
 * thereby guaranteeing cryptographic integrity across disparate systems and languages.
 */

// Dependency declarations assumed to be available in the execution environment
declare const CanonicalJsonStringifierTool: {
    execute(data: any): string;
};
declare function stringToUint8Array(input: string): Uint8Array;

class APM_CanonizerImpl {
    #stringifierTool;
    #utf8Converter;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Extracts synchronous dependency resolution and initialization logic.
     */
    #setupDependencies(): void {
        this.#stringifierTool = this.#resolveStringifierTool();
        this.#utf8Converter = this.#resolveUtf8Converter();
    }
    
    // --- I/O Proxies ---

    #throwDependencyError(message: string): never {
        throw new Error(message);
    }

    #resolveStringifierTool(): typeof CanonicalJsonStringifierTool {
        if (typeof CanonicalJsonStringifierTool === 'undefined') {
            this.#throwDependencyError("Dependency error: CanonicalJsonStringifierTool is not available.");
        }
        return CanonicalJsonStringifierTool;
    }

    #resolveUtf8Converter(): typeof stringToUint8Array {
        if (typeof stringToUint8Array !== 'function') {
            this.#throwDependencyError("Dependency error: stringToUint8Array utility is not available.");
        }
        return stringToUint8Array;
    }

    #delegateToStringifierExecution(data: any): string {
        return this.#stringifierTool.execute(data);
    }

    #delegateToConverterExecution(deterministicString: string): Uint8Array {
        return this.#utf8Converter(deterministicString);
    }

    /**
     * Converts a data object into its canonical UTF-8 byte representation.
     * 
     * @param data The object to canonicalize.
     * @returns {Uint8Array} The deterministic UTF-8 byte array (Buffer in Node.js).
     */
    canonicalizeAPM(data: any): Uint8Array {
        // 1. Get the deterministic JSON string via the stringifier tool.
        const deterministicString = this.#delegateToStringifierExecution(data);
        
        // 2. Convert string to UTF-8 bytes using the abstracted utility.
        return this.#delegateToConverterExecution(deterministicString);
    }
}

const APM_CANONIZER_SINGLETON = new APM_CanonizerImpl();

/**
 * Converts a data object into its canonical UTF-8 byte representation.
 * 
 * @param data The object to canonicalize.
 * @returns {Uint8Array} The deterministic UTF-8 byte array (Buffer in Node.js).
 */
export function canonicalizeAPM(data: any): Uint8Array {
    return APM_CANONIZER_SINGLETON.canonicalizeAPM(data);
}