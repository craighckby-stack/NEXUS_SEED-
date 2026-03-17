import { TEDSContract } from './ContractSchemaValidator'; 

// Assumed declaration for the injected AGI-KERNEL plugin
declare const AsynchronousJsonFileLoaderUtility: {
    execute: (args: { path: string }) => Promise<any>;
};

/**
 * ContractLoader handles asynchronous reading and parsing of contract definitions,
 * decoupling the Validator service from direct file system interaction by utilizing
 * the AsynchronousJsonFileLoaderUtility plugin.
 */
export class ContractLoader {

    /**
     * Reads a contract file asynchronously from the local file system using the utility plugin.
     * @param path The path to the JSON contract file.
     * @returns A promise resolving to the parsed TEDSContract object.
     * @throws {Error} If file loading or JSON parsing fails.
     */
    public static async loadFromFile(path: string): Promise<TEDSContract> {
        try {
            // Delegate file reading and parsing entirely to the external utility
            const parsedContract = await AsynchronousJsonFileLoaderUtility.execute({ path });
            
            // Type assertion necessary as the utility is generic
            return parsedContract as TEDSContract;
        } catch (error) {
            // Wrap the underlying error with contextual information for better debugging
            const errorMessage = (error instanceof Error) ? error.message : String(error);
            throw new Error(`[ContractLoader] Failed to load contract definition from path: ${path}. Underlying error: ${errorMessage}`);
        }
    }

    // Future methods could include: 
    // public static async loadFromConfigService(serviceUrl: string): Promise<TEDSContract> { ... }
}