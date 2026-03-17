/**
 * ArchivalTieringKernel
 * Enforces policy defined in the injected specification.
 * Responsible for moving data across storage tiers (hot -> warm -> cold -> purge).
 */

export class ArchivalTieringKernel {
    #spec: any;
    #adapter: StorageAdapterInterfaceKernel;
    #interval: number;
    #timer: NodeJS.Timeout | undefined;
    #policyDerivator: PolicyTimeDerivatorToolKernel;

    /**
     * @param spec The archival specification (config/epru_archival_spec.json content).
     * @param storageAdapter The storage interface kernel.
     * @param policyDerivator The policy derivation tool kernel.
     * @param intervalMs How often the tiering sweep should run in milliseconds.
     */
    constructor(spec: any, storageAdapter: StorageAdapterInterfaceKernel, policyDerivator: PolicyTimeDerivatorToolKernel, intervalMs: number = 3600000) {
        this.#spec = spec;
        this.#adapter = storageAdapter;
        this.#policyDerivator = policyDerivator;
        this.#interval = intervalMs;
        this.#setupDependencies();
    }

    #setupDependencies(): void {
        if (!this.#spec || !this.#spec.data_classes) {
            throw new Error("Archival specification must be provided and contain data_classes.");
        }
        if (!this.#adapter || typeof this.#adapter.findExpiredRecords !== 'function') {
            throw new Error("StorageAdapterInterfaceKernel dependency is invalid.");
        }
        if (!this.#policyDerivator || typeof this.#policyDerivator.execute !== 'function') {
            throw new Error("PolicyTimeDerivatorToolKernel dependency is invalid.");
        }
    }

    async execute(): Promise<void> {
        this.#logInfo("Starting Archival Tiering Sweep...");
        for (const dataClass of this.#spec.data_classes) {
            await this.processDataClass(dataClass);
        }
        this.#logInfo("Archival Tiering Sweep Complete.");
    }

    async processDataClass(dataClass: { class_name: string, policy: { retention_policy: string, ttl_seconds: number | null, tier: string } }): Promise<void> {
        const { class_name, policy } = dataClass;
        const { retention_policy, ttl_seconds, tier } = policy;

        if (retention_policy === 'time_to_live' && ttl_seconds !== null) {
            
            // 1. Utilize the injected utility via I/O proxy
            const cutoffTimestamp = this.#delegateToPolicyDerivatorExecute(ttl_seconds);
            
            // 2. Identify records older than TTL in the current tier
            const recordsToMove = await this.#delegateToStorageFindExpired(class_name, tier, cutoffTimestamp);

            // 3. Determine next action (Move to colder tier or Purge)
            const nextTier = this.determineNextTier(tier);

            for (const record of recordsToMove) {
                if (nextTier) {
                    await this.#delegateToStorageMigrate(record, nextTier);
                    this.#logInfo(`Migrated ${record.id} (${class_name}) to ${nextTier}`);
                } else {
                    await this.#delegateToStoragePurge(record);
                    this.#logInfo(`Purged ${record.id} (${class_name})`);
                }
            }
        }
    }

    determineNextTier(currentTier: string): string | null {
        const tierOrder: Record<string, string | null> = { hot_storage: 'warm_storage', warm_storage: 'cold_storage', cold_storage: null };
        return tierOrder[currentTier] || null;
    }

    start(): void {
        this.#timer = this.#delegateToSystemSetInterval(() => this.execute(), this.#interval);
        this.execute(); // Run immediately on startup
    }

    stop(): void {
        if (this.#timer) {
            this.#delegateToSystemClearInterval(this.#timer);
            this.#timer = undefined;
        }
    }

    // --- I/O Proxies ---

    #logInfo(message: string): void {
        console.log(message); // Placeholder for actual logger delegation
    }

    #delegateToPolicyDerivatorExecute(ttlSeconds: number): number {
        return this.#policyDerivator.execute({
            method: 'calculateTTLCutoff',
            ttlSeconds: ttlSeconds 
        });
    }

    async #delegateToStorageFindExpired(className: string, tier: string, cutoffTimestamp: number): Promise<any[]> {
        return this.#adapter.findExpiredRecords(className, tier, cutoffTimestamp);
    }
    
    async #delegateToStorageMigrate(record: any, nextTier: string): Promise<void> {
        // Assuming 'record' contains enough metadata for the adapter
        await this.#adapter.migrate(record, nextTier);
    }
    
    async #delegateToStoragePurge(record: any): Promise<void> {
        await this.#adapter.purge(record);
    }

    #delegateToSystemSetInterval(callback: (...args: any[]) => void, delay: number): NodeJS.Timeout {
        return setInterval(callback, delay);
    }

    #delegateToSystemClearInterval(timer: NodeJS.Timeout): void {
        clearInterval(timer);
    }
}

// Placeholder Interfaces (must be defined elsewhere)
interface StorageAdapterInterfaceKernel {
    findExpiredRecords(className: string, tier: string, cutoffTimestamp: number): Promise<any[]>;
    migrate(record: any, nextTier: string): Promise<void>;
    purge(record: any): Promise<void>;
}

interface PolicyTimeDerivatorToolKernel {
    execute(params: { method: 'calculateTTLCutoff', ttlSeconds: number }): number;
}