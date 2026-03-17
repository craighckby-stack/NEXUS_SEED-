import { CriticalParameterSetDefinition } from './gpr.types';
import { CachePersistenceInterfaceKernel } from '@agnostic/core/CachePersistenceInterfaceKernel';

export interface ParameterData {
    [key: string]: any;
}

/**
 * GPRFallbackServiceKernel manages local persistence and retrieval of critical GPR parameters
 * to ensure high availability and robust startup operation.
 * Adheres to AIA mandates by leveraging the asynchronous CachePersistenceInterfaceKernel
 * for secure, non-blocking I/O operations.
 */
export class GPRFallbackServiceKernel {
    private cachePersistenceKernel!: CachePersistenceInterfaceKernel;
    private readonly criticalSets: CriticalParameterSetDefinition[];

    /**
     * Initializes the kernel with the definitions of critical parameter sets.
     */
    constructor(criticalSets: CriticalParameterSetDefinition[]) {
        this.criticalSets = criticalSets;
    }

    /**
     * Mandatory asynchronous initialization hook.
     * Establishes dependency on the secure cache persistence kernel.
     * @param tools Required tool kernels for operation.
     */
    public async initialize(tools: { 
        CachePersistenceInterfaceKernel: CachePersistenceInterfaceKernel 
    }): Promise<void> {
        if (!tools.CachePersistenceInterfaceKernel) {
            throw new Error("GPRFallbackServiceKernel requires CachePersistenceInterfaceKernel.");
        }
        this.cachePersistenceKernel = tools.CachePersistenceInterfaceKernel;
        console.log("GPRFallbackServiceKernel initialized and bound to persistence layer.");
    }

    /**
     * Attempts to read a critical parameter set from the local cache storage via the persistent kernel.
     * Delegation handles persistence, serialization, and implicit staleness checking.
     * @param setId The identifier of the critical set.
     */
    public async loadFromCache(setId: string): Promise<ParameterData | null> {
        console.debug(`Attempting fallback load via cache persistence kernel for critical set: ${setId}`);
        
        // Delegate I/O to the specialized asynchronous tool
        const data = await this.cachePersistenceKernel.retrieveResource(setId);

        if (data === null) {
            console.warn(`Fallback cache miss or entry was stale for ${setId}.`);
            return null;
        }
        
        // Type casting the retrieved resource
        return data as ParameterData;
    }

    /**
     * Updates the local cache for a specific parameter set after a successful remote fetch.
     * @param setId The identifier of the set.
     * @param data The successfully retrieved parameter data.
     */
    public async updateCache(setId: string, data: ParameterData): Promise<void> {
        // Delegate persistence and serialization to the specialized asynchronous tool
        await this.cachePersistenceKernel.persistResource(setId, data);
        console.log(`Delegated cache update successful for ${setId}.`);
    }
}