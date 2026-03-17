import * as fs from 'fs/promises';
import { TEDSContract } from './ContractSchemaValidator'; 

/**
 * ContractLoader handles asynchronous reading and parsing of contract definitions,
 * decoupling the Validator service from direct file system interaction.
 */
export class ContractLoader {

    /**
     * Reads a contract file asynchronously from the local file system.
     * @param path The path to the JSON contract file.
     * @returns A promise resolving to the parsed TEDSContract object.
     */
    public static async loadFromFile(path: string): Promise<TEDSContract> {
        try {
            const contractContent = await fs.readFile(path, { encoding: 'utf-8' });
            return JSON.parse(contractContent) as TEDSContract;
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            throw new Error(
                `Failed to load or parse contract file located at ${path}: ${err.message}`
            );
        }
    }

    // Future methods could include: 
    // public static async loadFromConfigService(serviceUrl: string): Promise<TEDSContract> { ... }
}